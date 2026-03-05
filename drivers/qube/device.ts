'use strict';

import Homey from 'homey';
import { QubeModbusClient, type QubePollResult } from '../../lib/qubeModbus';
import { decodeUnitStatus } from '../../lib/qubeStatus';

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

module.exports = class QubeDevice extends Homey.Device {
  private client: QubeModbusClient | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastStatus: string | null = null;
  private lastAlarms: Record<string, boolean> = {};
  private consecutiveErrors = 0;
  private static readonly MAX_ERRORS_BEFORE_RECONNECT = 3;

  // ── Alarm key → capability + trigger id mapping ─────────────────
  private static readonly ALARM_MAP: { key: keyof QubePollResult; capabilityId: string; triggerId: string }[] = [
    { key: 'globalAlarm',            capabilityId: 'alarm_generic',                  triggerId: 'global' },
    { key: 'alarmFlow',              capabilityId: 'qube_alarm_flow',                triggerId: 'flow' },
    { key: 'alarmHeating',           capabilityId: 'qube_alarm_heating',             triggerId: 'heating' },
    { key: 'alarmCooling',           capabilityId: 'qube_alarm_cooling',             triggerId: 'cooling' },
    { key: 'alarmSource',            capabilityId: 'qube_alarm_source',              triggerId: 'source' },
    { key: 'alarmUser',              capabilityId: 'qube_alarm_user',                triggerId: 'user' },
    { key: 'alarmLegionellaTimeout', capabilityId: 'qube_alarm_legionella_timeout',  triggerId: 'legionella_timeout' },
    { key: 'alarmDhwTimeout',        capabilityId: 'qube_alarm_dhw_timeout',         triggerId: 'dhw_timeout' },
    { key: 'alarmWorkingHours',      capabilityId: 'qube_alarm_working_hours',       triggerId: 'working_hours' },
  ];

  // ── Lifecycle ───────────────────────────────────────────────────

  async onInit() {
    this.log('QubeDevice has been initialized');
    await this.setAvailable().catch(() => undefined);
    this.registerCapabilityListeners();
    await this.start();
  }

  async onDeleted() {
    await this.stop();
  }

  async onSettings({ newSettings }: { newSettings: Record<string, unknown> }) {
    if (!newSettings?.ip) {
      throw new Error(this.homey.__('errors.ip_required'));
    }
    // Return without throwing so Homey persists the new settings first.
    // Then restart on next tick — this.getSettings() will return updated values.
    this.homey.setTimeout(() => {
      this.restart().catch(err => this.error('Restart after settings change failed:', err));
    }, 250);
  }

  // ── Public accessor for Flow action cards ───────────────────────

  getClient(): QubeModbusClient {
    if (!this.client) {
      throw new Error(this.homey.__('errors.modbus_not_connected'));
    }
    return this.client;
  }

  // ── Capability listeners for settable controls ────────────────

  private registerCapabilityListeners() {
    this.registerCapabilityListener('qube_season_mode', async (value: string) => {
      const summer = value === 'summer';
      this.log('Setting season mode:', value, '(summer=' + summer + ')');
      await this.getClient().writeSeasonMode(summer);
    });

    this.registerCapabilityListener('qube_heating_setpoint', async (value: number) => {
      this.log('Setting heating setpoint:', value);
      await this.getClient().writeHeatingSetpoint(value);
    });

    this.registerCapabilityListener('qube_cooling_setpoint', async (value: number) => {
      this.log('Setting cooling setpoint:', value);
      await this.getClient().writeCoolingSetpoint(value);
    });

    this.registerCapabilityListener('qube_dhw_setpoint', async (value: number) => {
      this.log('Setting DHW setpoint:', value);
      await this.getClient().writeDhwSetpoint(value);
    });

    this.registerCapabilityListener('qube_heating_curve', async (value: boolean) => {
      this.log('Setting heating curve:', value);
      await this.getClient().writeHeatingCurve(value);
    });
  }

  // ── Internal helpers ────────────────────────────────────────────

  private getSettingsSafe() {
    const s = this.getSettings() as any;
    return {
      ip: String(s.ip || ''),
      port: isNumber(s.port) ? s.port : 502,
      unitId: isNumber(s.unitId) ? s.unitId : 1,
      pollIntervalMs: isNumber(s.pollIntervalMs) ? s.pollIntervalMs : 5000,
    };
  }

  private async start() {
    const { ip, port, unitId, pollIntervalMs } = this.getSettingsSafe();

    if (!ip) {
      await this.setUnavailable(this.homey.__('errors.missing_ip'));
      return;
    }

    this.client = new QubeModbusClient({ ip, port, unitId });

    try {
      await this.client.connect();
      await this.setAvailable();
      this.consecutiveErrors = 0;
    } catch (err: any) {
      this.error('Initial Modbus connect failed', err?.message || err);
      await this.setUnavailable(this.homey.__('errors.modbus_connect_failed'));
    }

    this.pollTimer = this.homey.setInterval(async () => {
      await this.pollOnce();
    }, pollIntervalMs);

    await this.pollOnce();
  }

  private async stop() {
    if (this.pollTimer) {
      this.homey.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.client) {
      await this.client.disconnect().catch(() => undefined);
      this.client = null;
    }
  }

  private async restart() {
    await this.stop();
    await this.start();
  }

  private async reconnect() {
    this.log('Attempting Modbus reconnect…');
    if (this.client) {
      await this.client.disconnect().catch(() => undefined);
    }
    try {
      const { ip, port, unitId } = this.getSettingsSafe();
      this.client = new QubeModbusClient({ ip, port, unitId });
      await this.client.connect();
      this.consecutiveErrors = 0;
      await this.setAvailable();
      this.log('Reconnected successfully');
    } catch (err: any) {
      this.error('Reconnect failed', err?.message || err);
    }
  }

  // ── Polling ─────────────────────────────────────────────────────

  private async pollOnce() {
    if (!this.client) return;

    let res: QubePollResult;
    try {
      res = await this.client.poll();
      this.consecutiveErrors = 0;
    } catch (err: any) {
      this.consecutiveErrors++;
      this.error(`Polling failed (${this.consecutiveErrors}x)`, err?.message || err);
      await this.setUnavailable(this.homey.__('errors.modbus_poll_failed'));

      if (this.consecutiveErrors >= QubeDevice.MAX_ERRORS_BEFORE_RECONNECT) {
        await this.reconnect();
      }
      return;
    }

    await this.setAvailable().catch(() => undefined);

    // ── Status ────────────────────────────────────────────────────
    const statusKey = decodeUnitStatus(res.unitStatusRaw, res.globalAlarm);
    const statusDecoded = this.homey.__(`status.${statusKey}`) || statusKey;
    await this.setCapabilityValue('qube_unitstatus_raw', res.unitStatusRaw).catch(() => undefined);
    await this.setCapabilityValue('qube_status', statusDecoded).catch(() => undefined);

    // ── Temperatures ──────────────────────────────────────────────
    await this.setCapabilityValue('measure_temperature.supply', round2(res.supplyTemp)).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.return', round2(res.returnTemp)).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.source_in', round2(res.sourceInTemp)).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.source_out', round2(res.sourceOutTemp)).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.room', round2(res.roomTemp)).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.dhw', round2(res.dhwTemp)).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.outdoor', round2(res.outdoorTemp)).catch(() => undefined);

    // ── Flow / COP / Energy ───────────────────────────────────────
    await this.setCapabilityValue('qube_flow', round2(res.flow)).catch(() => undefined);
    await this.setCapabilityValue('measure_cop', round2(res.cop)).catch(() => undefined);
    await this.setCapabilityValue('measure_power', round2(res.electricPower)).catch(() => undefined);
    await this.setCapabilityValue('qube_meter_electric', round2(res.energyElectric)).catch(() => undefined);
    await this.setCapabilityValue('qube_energy_thermal', round2(res.energyThermal)).catch(() => undefined);

    // ── Additional sensors ────────────────────────────────────────
    await this.setCapabilityValue('qube_power_thermal', round2(res.thermalPower)).catch(() => undefined);
    await this.setCapabilityValue('qube_compressor_speed', Math.round(res.compressorSpeed)).catch(() => undefined);
    await this.setCapabilityValue('qube_hours_dhw', res.hoursDhw).catch(() => undefined);
    await this.setCapabilityValue('qube_hours_heating', res.hoursHeating).catch(() => undefined);
    await this.setCapabilityValue('qube_hours_cooling', res.hoursCooling).catch(() => undefined);

    // ── Digital outputs (pumps / valves / heaters) ──────────────
    await this.setCapabilityValue('qube_source_pump', res.sourcePump).catch(() => undefined);
    await this.setCapabilityValue('qube_user_pump', res.userPump).catch(() => undefined);
    await this.setCapabilityValue('qube_fourway_valve', res.fourwayValve).catch(() => undefined);
    await this.setCapabilityValue('qube_threeway_valve', res.threewayValve).catch(() => undefined);
    await this.setCapabilityValue('qube_heater1', res.heater1).catch(() => undefined);
    await this.setCapabilityValue('qube_heater2', res.heater2).catch(() => undefined);

    // ── Controls (read back current state) ───────────────────────
    await this.setCapabilityValue('qube_season_mode', res.seasonSummer ? 'summer' : 'winter').catch(() => undefined);
    await this.setCapabilityValue('qube_heating_setpoint', round2(res.heatingSetpoint)).catch(() => undefined);
    await this.setCapabilityValue('qube_cooling_setpoint', round2(res.coolingSetpoint)).catch(() => undefined);
    await this.setCapabilityValue('qube_dhw_setpoint', round2(res.dhwSetpoint)).catch(() => undefined);
    await this.setCapabilityValue('qube_heating_curve', res.heatingCurveEnabled).catch(() => undefined);

    // ── Alarms ────────────────────────────────────────────────────
    for (const alarm of QubeDevice.ALARM_MAP) {
      const current = Boolean(res[alarm.key]);
      await this.setCapabilityValue(alarm.capabilityId, current).catch(() => undefined);
    }

    // ── Transition triggers ───────────────────────────────────────
    await this.checkTransitions({ statusDecoded, res });
  }

  private async checkTransitions({ statusDecoded, res }: { statusDecoded: string; res: QubePollResult }) {
    const app = this.homey.app as any;

    // Unit status change
    if (this.lastStatus !== null && this.lastStatus !== statusDecoded) {
      if (typeof app?.triggerUnitStatusChanged === 'function') {
        await app.triggerUnitStatusChanged(this, {
          old_status: this.lastStatus,
          new_status: statusDecoded,
          raw_unitstatus: res.unitStatusRaw,
          status_code: res.unitStatusRaw,
        }).catch(() => undefined);
      }
    }
    this.lastStatus = statusDecoded;

    // Individual alarm transitions (false → true fires the "alarm ON" trigger)
    for (const alarm of QubeDevice.ALARM_MAP) {
      const current = Boolean(res[alarm.key]);
      const previous = this.lastAlarms[alarm.triggerId];

      if (previous !== undefined && !previous && current) {
        // Alarm just turned ON
        if (alarm.triggerId === 'global') {
          if (typeof app?.triggerGlobalAlarmChanged === 'function') {
            await app.triggerGlobalAlarmChanged(this, { alarm_on: true }).catch(() => undefined);
          }
        } else {
          if (typeof app?.triggerAlarmOn === 'function') {
            await app.triggerAlarmOn(this, alarm.triggerId).catch(() => undefined);
          }
        }
      } else if (previous !== undefined && previous && !current && alarm.triggerId === 'global') {
        // Global alarm just turned OFF
        if (typeof app?.triggerGlobalAlarmChanged === 'function') {
          await app.triggerGlobalAlarmChanged(this, { alarm_on: false }).catch(() => undefined);
        }
      }

      this.lastAlarms[alarm.triggerId] = current;
    }
  }
};
