'use strict';

import Homey from 'homey';
import { QubeModbusClient, type QubePollResult } from '../../lib/qubeModbus';
import { decodeUnitStatus, STATUS_TEXT_MAP } from '../../lib/qubeStatus';

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

module.exports = class QubeDevice extends Homey.Device {
  private client: QubeModbusClient | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastStatusKey: string | null = null;
  private lastAlarms: Record<string, boolean> = {};
  private consecutiveErrors = 0;
  private static readonly MAX_ERRORS_BEFORE_RECONNECT = 3;

  // ── Cached metric values (for condition card getters) ──────────
  private _currentStatusKey = '';
  private _supplyTemp = 0;
  private _returnTemp = 0;
  private _sourceInTemp = 0;
  private _sourceOutTemp = 0;
  private _roomTemp = 0;
  private _dhwTemp = 0;
  private _outdoorTemp = 0;
  private _cop = 0;
  private _electricPower = 0;
  private _thermalPower = 0;
  private _heatingDt = 0;
  private _sourceDt = 0;
  private _runtimeEfficiency = 0;
  private _lastRawUnitStatus = 0;

  // ── Last metric values (for change detection) ──────────────────
  private _lastMetrics: Record<string, number> = {};

  // ── Monotonic energy counters ─────────────────────────────────
  private _lastEnergyElectric: number | null = null;
  private _lastEnergyThermal: number | null = null;

  // ── Alarm key → capability + alarm id mapping ─────────────────
  private static readonly ALARM_MAP: { key: keyof QubePollResult; capabilityId: string; alarmId: string }[] = [
    { key: 'globalAlarm',            capabilityId: 'qube_alarm_global',              alarmId: 'global' },
    { key: 'alarmFlow',              capabilityId: 'qube_alarm_flow',                alarmId: 'flow' },
    { key: 'alarmHeating',           capabilityId: 'qube_alarm_heating',             alarmId: 'heating' },
    { key: 'alarmCooling',           capabilityId: 'qube_alarm_cooling',             alarmId: 'cooling' },
    { key: 'alarmSource',            capabilityId: 'qube_alarm_source',              alarmId: 'source' },
    { key: 'alarmUser',              capabilityId: 'qube_alarm_user',                alarmId: 'user' },
    { key: 'alarmLegionellaTimeout', capabilityId: 'qube_alarm_legionella_timeout',  alarmId: 'legionella_timeout' },
    { key: 'alarmDhwTimeout',        capabilityId: 'qube_alarm_dhw_timeout',         alarmId: 'dhw_timeout' },
    { key: 'alarmWorkingHours',      capabilityId: 'qube_alarm_working_hours',       alarmId: 'working_hours' },
  ];

  // ── Lifecycle ───────────────────────────────────────────────────

  async onInit() {
    this.log('QubeDevice has been initialized');
    await this.migrateCapabilities();
    await this.setAvailable().catch(() => undefined);
    this.registerCapabilityListeners();
    await this.start();
  }

  private static readonly MIGRATION_VERSION = 7;

  private static readonly EXPECTED_CAPABILITIES = [
    // Device status indicators (measure_*/alarm_generic prefix for Homey indicator system)
    'alarm_generic',
    'measure_cop', 'measure_flow', 'measure_runtime_efficiency',
    'measure_heating_dt', 'measure_source_dt',
    'measure_temperature.room', 'measure_temperature.dhw', 'measure_temperature.outdoor',
    'measure_power', 'measure_power_thermal', 'measure_compressor_speed',
    // Status & raw
    'qube_status', 'qube_unitstatus_raw',
    // Individual alarms
    'qube_alarm_global', 'qube_alarm_flow', 'qube_alarm_heating',
    'qube_alarm_cooling', 'qube_alarm_source', 'qube_alarm_user',
    'qube_alarm_legionella_timeout', 'qube_alarm_dhw_timeout',
    'qube_alarm_working_hours',
    // Digital outputs
    'qube_source_pump', 'qube_user_pump',
    'qube_fourway_valve', 'qube_threeway_valve',
    'qube_heater1', 'qube_heater2', 'qube_heater3',
    'qube_buffer_pump',
    // Non-indicator temperatures
    'qube_temp_supply', 'qube_temp_return',
    'qube_temp_source_in', 'qube_temp_source_out',
    // Energy
    'qube_meter_electric', 'qube_energy_thermal',
    // Performance
    'qube_compressor_demand',
    // Working hours
    'qube_hours_dhw', 'qube_hours_heating', 'qube_hours_cooling',
    // Controls
    'qube_season_mode',
    'qube_heating_setpoint_day', 'qube_heating_setpoint_night',
    'qube_cooling_setpoint_day', 'qube_cooling_setpoint_night',
    'qube_dhw_setpoint',
    // Control status
    'qube_bms_demand', 'qube_heating_curve_status',
    'qube_dhw_program_status', 'qube_sg_ready_status',
    'qube_antilegionella_enabled', 'qube_daynight_mode',
    'qube_dhw_controller_enabled', 'qube_pv_surplus',
    'qube_thermostat_demand',
    // Calculated setpoints
    'qube_calc_hp_setpoint', 'qube_calc_cooling_setpoint',
    'qube_calc_dhw_setpoint',
  ];

  private async migrateCapabilities() {
    const deprecated = [
      // Old qube_* capabilities replaced by measure_*/alarm_generic indicators
      'qube_alarm_active', 'qube_cop', 'qube_flow', 'qube_power',
      'qube_power_thermal', 'qube_compressor_speed',
      'qube_heating_dt', 'qube_source_dt', 'qube_runtime_efficiency',
      'qube_temp_room', 'qube_temp_dhw', 'qube_temp_outdoor',
      // Legacy capabilities from older versions
      'measure_temperature.supply', 'measure_temperature.return',
      'measure_temperature.source_in', 'measure_temperature.source_out',
      'qube_heating_setpoint', 'qube_cooling_setpoint', 'qube_heating_curve',
      'qube_demand',
    ];

    // Remove deprecated capabilities
    for (const cap of deprecated) {
      if (this.hasCapability(cap)) {
        this.log(`Removing deprecated capability: ${cap}`);
        await this.removeCapability(cap).catch(err =>
          this.error(`Failed to remove capability ${cap}:`, err));
      }
    }

    // Force-refresh: remove and re-add ALL capabilities so Homey picks up
    // updated definitions (e.g. uiComponent additions). Runs once per version.
    const storedVersion = this.getStoreValue('migration_version') ?? 0;
    if (storedVersion < QubeDevice.MIGRATION_VERSION) {
      this.log(`Migration v${storedVersion} → v${QubeDevice.MIGRATION_VERSION}: refreshing all capabilities`);
      for (const cap of this.getCapabilities()) {
        await this.removeCapability(cap).catch(() => undefined);
      }
      for (const cap of QubeDevice.EXPECTED_CAPABILITIES) {
        await this.addCapability(cap).catch(err =>
          this.error(`Failed to add capability ${cap}:`, err));
      }
      await this.setStoreValue('migration_version', QubeDevice.MIGRATION_VERSION);
    } else {
      // Normal migration: only add missing capabilities
      for (const cap of QubeDevice.EXPECTED_CAPABILITIES) {
        if (!this.hasCapability(cap)) {
          this.log(`Adding missing capability: ${cap}`);
          await this.addCapability(cap).catch(err =>
            this.error(`Failed to add capability ${cap}:`, err));
        }
      }
    }

    this.log(`Migration v${QubeDevice.MIGRATION_VERSION} complete. Capabilities (${this.getCapabilities().length}): ${this.getCapabilities().join(', ')}`);
  }

  async onDeleted() {
    await this.stop();
  }

  async onSettings({ newSettings }: { newSettings: Record<string, unknown> }) {
    if (!newSettings?.ip) {
      throw new Error(this.homey.__('errors.ip_required'));
    }
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

  // ── Public getters for condition cards ──────────────────────────

  getCurrentStatus(): string { return this._currentStatusKey; }
  getSupplyTemp(): number { return this._supplyTemp; }
  getReturnTemp(): number { return this._returnTemp; }
  getSourceInTemp(): number { return this._sourceInTemp; }
  getSourceOutTemp(): number { return this._sourceOutTemp; }
  getRoomTemp(): number { return this._roomTemp; }
  getDhwTemp(): number { return this._dhwTemp; }
  getOutdoorTemp(): number { return this._outdoorTemp; }
  getCop(): number { return this._cop; }
  getElectricPower(): number { return this._electricPower; }
  getPower(): number { return this._electricPower; }
  getThermalPower(): number { return this._thermalPower; }
  getHeatingDt(): number { return this._heatingDt; }
  getSourceDt(): number { return this._sourceDt; }

  getAlarmState(alarmId: string): boolean {
    return this.lastAlarms[alarmId] ?? false;
  }

  // ── Day/night setpoint helpers for action cards ────────────────

  async writeHeatingSetpointByPeriod(period: string, temperature: number) {
    const client = this.getClient();
    if (period === 'day') {
      await client.writeHeatingDaySetpoint(temperature);
    } else {
      await client.writeHeatingNightSetpoint(temperature);
    }
  }

  async writeCoolingSetpointByPeriod(period: string, temperature: number) {
    const client = this.getClient();
    if (period === 'day') {
      await client.writeCoolingDaySetpoint(temperature);
    } else {
      await client.writeCoolingNightSetpoint(temperature);
    }
  }

  // ── Capability listeners for settable controls ────────────────

  private registerCapabilityListeners() {
    this.registerCapabilityListener('qube_season_mode', async (value: string) => {
      const summer = value === 'Summer (Cooling)';
      this.log('Setting season mode:', value, '(summer=' + summer + ')');
      await this.getClient().writeSeasonMode(summer);
    });

    this.registerCapabilityListener('qube_heating_setpoint_day', async (value: number) => {
      this.log('Setting heating day setpoint:', value);
      await this.getClient().writeHeatingDaySetpoint(value);
    });

    this.registerCapabilityListener('qube_heating_setpoint_night', async (value: number) => {
      this.log('Setting heating night setpoint:', value);
      await this.getClient().writeHeatingNightSetpoint(value);
    });

    this.registerCapabilityListener('qube_cooling_setpoint_day', async (value: number) => {
      this.log('Setting cooling day setpoint:', value);
      await this.getClient().writeCoolingDaySetpoint(value);
    });

    this.registerCapabilityListener('qube_cooling_setpoint_night', async (value: number) => {
      this.log('Setting cooling night setpoint:', value);
      await this.getClient().writeCoolingNightSetpoint(value);
    });

    this.registerCapabilityListener('qube_dhw_setpoint', async (value: number) => {
      this.log('Setting DHW setpoint:', value);
      await this.getClient().writeDhwSetpoint(value);
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
    const statusKey = decodeUnitStatus(res.unitStatusRaw);
    const statusText = (STATUS_TEXT_MAP[statusKey] ?? STATUS_TEXT_MAP['unknown']).en;
    this._currentStatusKey = statusKey;
    await this.setCapabilityValue('qube_unitstatus_raw', res.unitStatusRaw).catch(() => undefined);
    await this.setCapabilityValue('qube_status', statusText).catch(() => undefined);

    // ── Temperatures (treat -999 as "sensor not installed") ───────
    this._supplyTemp = round2(res.supplyTemp);
    this._returnTemp = round2(res.returnTemp);
    this._sourceInTemp = round2(res.sourceInTemp);
    this._sourceOutTemp = round2(res.sourceOutTemp);
    this._roomTemp = res.roomTemp <= -900 ? 0 : round2(res.roomTemp);
    this._dhwTemp = round2(res.dhwTemp);
    this._outdoorTemp = round2(res.outdoorTemp);

    await this.setCapabilityValue('qube_temp_supply', this._supplyTemp).catch(() => undefined);
    await this.setCapabilityValue('qube_temp_return', this._returnTemp).catch(() => undefined);
    await this.setCapabilityValue('qube_temp_source_in', this._sourceInTemp).catch(() => undefined);
    await this.setCapabilityValue('qube_temp_source_out', this._sourceOutTemp).catch(() => undefined);
    if (res.roomTemp > -900) {
      await this.setCapabilityValue('measure_temperature.room', this._roomTemp).catch(() => undefined);
    }
    await this.setCapabilityValue('measure_temperature.dhw', this._dhwTemp).catch(() => undefined);
    await this.setCapabilityValue('measure_temperature.outdoor', this._outdoorTemp).catch(() => undefined);

    // ── Flow / COP / Energy ───────────────────────────────────────
    await this.setCapabilityValue('measure_flow', round2(res.flow)).catch(() => undefined);
    this._cop = round2(res.cop);
    this._electricPower = round2(res.electricPower);
    await this.setCapabilityValue('measure_cop', this._cop).catch(() => undefined);
    await this.setCapabilityValue('measure_power', this._electricPower).catch(() => undefined);
    // Monotonic energy counters — clamp so they never go backwards (float jitter)
    let energyElectric = round2(res.energyElectric);
    if (this._lastEnergyElectric !== null && energyElectric < this._lastEnergyElectric) {
      energyElectric = this._lastEnergyElectric;
    }
    this._lastEnergyElectric = energyElectric;

    let energyThermal = round2(res.energyThermal);
    if (this._lastEnergyThermal !== null && energyThermal < this._lastEnergyThermal) {
      energyThermal = this._lastEnergyThermal;
    }
    this._lastEnergyThermal = energyThermal;

    await this.setCapabilityValue('qube_meter_electric', energyElectric).catch(() => undefined);
    await this.setCapabilityValue('qube_energy_thermal', energyThermal).catch(() => undefined);

    // ── Additional sensors ────────────────────────────────────────
    this._thermalPower = round2(res.thermalPower);
    await this.setCapabilityValue('measure_power_thermal', this._thermalPower).catch(() => undefined);
    await this.setCapabilityValue('measure_compressor_speed', Math.round(res.compressorSpeed)).catch(() => undefined);
    await this.setCapabilityValue('qube_hours_dhw', res.hoursDhw).catch(() => undefined);
    await this.setCapabilityValue('qube_hours_heating', res.hoursHeating).catch(() => undefined);
    await this.setCapabilityValue('qube_hours_cooling', res.hoursCooling).catch(() => undefined);

    // ── Derived metrics ──────────────────────────────────────────
    this._heatingDt = round2(this._supplyTemp - this._returnTemp);
    this._sourceDt = round2(this._sourceInTemp - this._sourceOutTemp);
    await this.setCapabilityValue('measure_heating_dt', this._heatingDt).catch(() => undefined);
    await this.setCapabilityValue('measure_source_dt', this._sourceDt).catch(() => undefined);

    // Runtime efficiency: thermal kWh / heating hours
    const runtimeEff = res.hoursHeating > 0 ? round2(res.energyThermal / res.hoursHeating) : 0;
    this._runtimeEfficiency = runtimeEff;
    await this.setCapabilityValue('measure_runtime_efficiency', runtimeEff).catch(() => undefined);

    // ── Digital outputs (pumps / valves / heaters) ──────────────
    await this.setCapabilityValue('qube_source_pump', res.sourcePump).catch(() => undefined);
    await this.setCapabilityValue('qube_user_pump', res.userPump).catch(() => undefined);
    await this.setCapabilityValue('qube_fourway_valve', res.fourwayValve).catch(() => undefined);
    await this.setCapabilityValue('qube_threeway_valve', res.threewayValve).catch(() => undefined);
    await this.setCapabilityValue('qube_heater1', res.heater1).catch(() => undefined);
    await this.setCapabilityValue('qube_heater2', res.heater2).catch(() => undefined);

    // ── Controls (read back current state) ───────────────────────
    await this.setCapabilityValue('qube_season_mode', res.seasonSummer ? 'Summer (Cooling)' : 'Winter (Heating)').catch(() => undefined);
    await this.setCapabilityValue('qube_bms_demand', res.demand).catch(() => undefined);
    await this.setCapabilityValue('qube_heating_curve_status', res.heatingCurveEnabled).catch(() => undefined);
    await this.setCapabilityValue('qube_dhw_program_status', res.dhwProgramActive).catch(() => undefined);
    await this.setCapabilityValue('qube_sg_ready_status', res.sgReadyMode).catch(() => undefined);
    await this.setCapabilityValue('qube_heating_setpoint_day', round2(res.heatingSetpointDay)).catch(() => undefined);
    await this.setCapabilityValue('qube_heating_setpoint_night', round2(res.heatingSetpointNight)).catch(() => undefined);
    await this.setCapabilityValue('qube_cooling_setpoint_day', round2(res.coolingSetpointDay)).catch(() => undefined);
    await this.setCapabilityValue('qube_cooling_setpoint_night', round2(res.coolingSetpointNight)).catch(() => undefined);
    await this.setCapabilityValue('qube_dhw_setpoint', round2(res.dhwSetpoint)).catch(() => undefined);

    // ── Additional sensors (from HA integration) ────────────────
    await this.setCapabilityValue('qube_antilegionella_enabled', res.antilegionellaEnabled).catch(() => undefined);
    await this.setCapabilityValue('qube_daynight_mode', res.dayNightMode).catch(() => undefined);
    await this.setCapabilityValue('qube_compressor_demand', round2(res.compressorDemand)).catch(() => undefined);
    await this.setCapabilityValue('qube_dhw_controller_enabled', res.dhwControllerEnabled).catch(() => undefined);
    await this.setCapabilityValue('qube_calc_hp_setpoint', round2(res.calcHpSetpoint)).catch(() => undefined);
    await this.setCapabilityValue('qube_calc_cooling_setpoint', round2(res.calcCoolingSetpoint)).catch(() => undefined);
    await this.setCapabilityValue('qube_calc_dhw_setpoint', round2(res.calcDhwSetpoint)).catch(() => undefined);
    await this.setCapabilityValue('qube_pv_surplus', res.pvSurplus).catch(() => undefined);
    await this.setCapabilityValue('qube_buffer_pump', res.bufferPump).catch(() => undefined);
    await this.setCapabilityValue('qube_heater3', res.heater3).catch(() => undefined);
    await this.setCapabilityValue('qube_thermostat_demand', res.thermostatDemand).catch(() => undefined);

    // ── Alarms ────────────────────────────────────────────────────
    let anyAlarm = false;
    for (const alarm of QubeDevice.ALARM_MAP) {
      const current = Boolean(res[alarm.key]);
      if (current) anyAlarm = true;
      await this.setCapabilityValue(alarm.capabilityId, current).catch(() => undefined);
    }
    await this.setCapabilityValue('alarm_generic', anyAlarm).catch(() => undefined);

    // ── Transition triggers ───────────────────────────────────────
    await this.checkTransitions({ statusKey, res });
  }

  private async checkTransitions({ statusKey, res }: { statusKey: string; res: QubePollResult }) {
    const app = this.homey.app as any;

    // Unit status change — only fires when decoded status text changes
    if (this.lastStatusKey !== null && this.lastStatusKey !== statusKey) {
      const oldText = (STATUS_TEXT_MAP[this.lastStatusKey] ?? STATUS_TEXT_MAP['unknown']).en;
      const newText = (STATUS_TEXT_MAP[statusKey] ?? STATUS_TEXT_MAP['unknown']).en;
      if (typeof app?.triggerUnitStatusChanged === 'function') {
        await app.triggerUnitStatusChanged(this, {
          old_status: this.lastStatusKey,
          new_status: statusKey,
          old_status_text: oldText,
          new_status_text: newText,
          old_raw_unitstatus: this._lastRawUnitStatus,
          new_raw_unitstatus: res.unitStatusRaw,
        }).catch(() => undefined);
      }
    }
    this._lastRawUnitStatus = res.unitStatusRaw;
    this.lastStatusKey = statusKey;

    // Alarm transitions (fires for both ON and OFF transitions)
    for (const alarm of QubeDevice.ALARM_MAP) {
      const current = Boolean(res[alarm.key]);
      const previous = this.lastAlarms[alarm.alarmId];

      if (previous !== undefined && previous !== current) {
        const alarmText = this.homey.__(`alarms.${alarm.alarmId}`) || alarm.alarmId;
        if (typeof app?.triggerAlarmStateChanged === 'function') {
          await app.triggerAlarmStateChanged(this, {
            alarm: alarm.alarmId,
            state: current,
            alarm_text: alarmText,
          }).catch(() => undefined);
        }
      }

      this.lastAlarms[alarm.alarmId] = current;
    }

    // Metric change triggers
    const metricTriggers: { triggerId: string; value: number }[] = [
      { triggerId: 'supply-temp-changed', value: this._supplyTemp },
      { triggerId: 'return-temp-changed', value: this._returnTemp },
      { triggerId: 'source-in-temp-changed', value: this._sourceInTemp },
      { triggerId: 'source-out-temp-changed', value: this._sourceOutTemp },
      { triggerId: 'room-temp-changed', value: this._roomTemp },
      { triggerId: 'dhw-temp-changed', value: this._dhwTemp },
      { triggerId: 'outdoor-temp-changed', value: this._outdoorTemp },
      { triggerId: 'cop-changed', value: this._cop },
      { triggerId: 'power-changed', value: this._electricPower },
      { triggerId: 'thermal-power-changed', value: this._thermalPower },
      { triggerId: 'heating-dt-changed', value: this._heatingDt },
      { triggerId: 'source-dt-changed', value: this._sourceDt },
    ];

    for (const mt of metricTriggers) {
      const last = this._lastMetrics[mt.triggerId];
      if (last !== undefined && last !== mt.value) {
        if (typeof app?.triggerMetricChanged === 'function') {
          await app.triggerMetricChanged(mt.triggerId, this, { value: mt.value }).catch(() => undefined);
        }
      }
      this._lastMetrics[mt.triggerId] = mt.value;
    }
  }
};
