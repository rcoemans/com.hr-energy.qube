'use strict';

import Homey from 'homey';

// ── Operator evaluation helper ──────────────────────────────────
function evaluateOperator(actual: number, operator: string, target: number): boolean {
  switch (operator) {
    case 'gt':  return actual > target;
    case 'lt':  return actual < target;
    case 'gte': return actual >= target;
    case 'lte': return actual <= target;
    default:    return false;
  }
}

module.exports = class QubeApp extends Homey.App {

  // ── Trigger cards (WHEN) ────────────────────────────────────────
  private unitStatusChangedTrigger!: Homey.FlowCardTriggerDevice;
  private alarmStateChangedTrigger!: Homey.FlowCardTriggerDevice;

  private supplyTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private returnTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private sourceInTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private sourceOutTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private roomTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private dhwTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private outdoorTempChangedTrigger!: Homey.FlowCardTriggerDevice;
  private copChangedTrigger!: Homey.FlowCardTriggerDevice;
  private electricPowerChangedTrigger!: Homey.FlowCardTriggerDevice;
  private powerChangedTrigger!: Homey.FlowCardTriggerDevice;
  private heatingDtChangedTrigger!: Homey.FlowCardTriggerDevice;
  private sourceDtChangedTrigger!: Homey.FlowCardTriggerDevice;

  async onInit() {
    this.log('QubeApp has been initialized');

    // ── Register WHEN triggers ────────────────────────────────────
    this.unitStatusChangedTrigger = this.homey.flow.getDeviceTriggerCard('unit-status-changed');
    this.alarmStateChangedTrigger = this.homey.flow.getDeviceTriggerCard('alarm-state-changed');

    this.supplyTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('supply-temp-changed');
    this.returnTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('return-temp-changed');
    this.sourceInTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('source-in-temp-changed');
    this.sourceOutTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('source-out-temp-changed');
    this.roomTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('room-temp-changed');
    this.dhwTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('dhw-temp-changed');
    this.outdoorTempChangedTrigger = this.homey.flow.getDeviceTriggerCard('outdoor-temp-changed');
    this.copChangedTrigger = this.homey.flow.getDeviceTriggerCard('cop-changed');
    this.electricPowerChangedTrigger = this.homey.flow.getDeviceTriggerCard('electric-power-changed');
    this.powerChangedTrigger = this.homey.flow.getDeviceTriggerCard('power-changed');
    this.heatingDtChangedTrigger = this.homey.flow.getDeviceTriggerCard('heating-dt-changed');
    this.sourceDtChangedTrigger = this.homey.flow.getDeviceTriggerCard('source-dt-changed');

    // ── Register AND conditions ───────────────────────────────────
    this.homey.flow.getConditionCard('unit-status-is')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        const currentStatus = device.getCurrentStatus?.() ?? '';
        return currentStatus === args.status;
      });

    this.homey.flow.getConditionCard('alarm-is')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        const isOn = device.getAlarmState?.(args.alarm) ?? false;
        return args.status === 'on' ? isOn : !isOn;
      });

    // Metric conditions with operator
    const metricConditions: { cardId: string; getter: string }[] = [
      { cardId: 'supply-temp-is',        getter: 'getSupplyTemp' },
      { cardId: 'return-temp-is',        getter: 'getReturnTemp' },
      { cardId: 'source-in-temp-is',     getter: 'getSourceInTemp' },
      { cardId: 'source-out-temp-is',    getter: 'getSourceOutTemp' },
      { cardId: 'room-temp-is',          getter: 'getRoomTemp' },
      { cardId: 'dhw-temp-is',           getter: 'getDhwTemp' },
      { cardId: 'outdoor-temp-is',       getter: 'getOutdoorTemp' },
      { cardId: 'cop-is',               getter: 'getCop' },
      { cardId: 'electric-power-is',     getter: 'getElectricPower' },
      { cardId: 'power-is',             getter: 'getPower' },
      { cardId: 'heating-dt-is',         getter: 'getHeatingDt' },
      { cardId: 'source-dt-is',          getter: 'getSourceDt' },
    ];

    for (const mc of metricConditions) {
      this.homey.flow.getConditionCard(mc.cardId)
        .registerRunListener(async (args: any) => {
          const device = args.device as any;
          const value = typeof device[mc.getter] === 'function' ? device[mc.getter]() : 0;
          return evaluateOperator(value, args.operator, args.value);
        });
    }

    // ── Register THEN actions ─────────────────────────────────────
    this.homey.flow.getActionCard('set-bms-demand')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeDemand(args.status === 'on');
      });

    this.homey.flow.getActionCard('set-season-mode')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeSeasonMode(args.value === '1');
      });

    this.homey.flow.getActionCard('force-dhw-program')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeForceDhwProgram(true);
      });

    this.homey.flow.getActionCard('set-dhw-program')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeForceDhwProgram(args.status === 'on');
      });

    this.homey.flow.getActionCard('force-antilegionella')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeStartAntiLegionella();
      });

    this.homey.flow.getActionCard('set-sg-ready-mode')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeSgReadyMode(args.value);
      });

    this.homey.flow.getActionCard('set-heating-setpoint')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.writeHeatingSetpointByPeriod(args.period, args.temperature);
      });

    this.homey.flow.getActionCard('set-cooling-setpoint')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.writeCoolingSetpointByPeriod(args.period, args.temperature);
      });

    this.homey.flow.getActionCard('set-dhw-setpoint')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeDhwSetpoint(args.temperature);
      });

    this.homey.flow.getActionCard('set-heating-curve')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeHeatingCurve(args.status === 'on');
      });

    this.homey.flow.getActionCard('write-modbus-register')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeAdvancedRegister(args.address, args.value, args.datatype);
      });
  }

  // ── Public methods called by device.ts ──────────────────────────

  async triggerUnitStatusChanged(device: Homey.Device, tokens: {
    old_status: string;
    new_status: string;
    raw_unitstatus: number;
    status_text: string;
  }) {
    await this.unitStatusChangedTrigger.trigger(device, tokens).catch(this.error);
  }

  async triggerAlarmStateChanged(device: Homey.Device, tokens: {
    alarm: string;
    state: string;
    alarm_text: string;
  }) {
    await this.alarmStateChangedTrigger.trigger(device, tokens).catch(this.error);
  }

  async triggerMetricChanged(triggerId: string, device: Homey.Device, tokens: { value: number }) {
    const triggerMap: Record<string, Homey.FlowCardTriggerDevice> = {
      'supply-temp-changed': this.supplyTempChangedTrigger,
      'return-temp-changed': this.returnTempChangedTrigger,
      'source-in-temp-changed': this.sourceInTempChangedTrigger,
      'source-out-temp-changed': this.sourceOutTempChangedTrigger,
      'room-temp-changed': this.roomTempChangedTrigger,
      'dhw-temp-changed': this.dhwTempChangedTrigger,
      'outdoor-temp-changed': this.outdoorTempChangedTrigger,
      'cop-changed': this.copChangedTrigger,
      'electric-power-changed': this.electricPowerChangedTrigger,
      'power-changed': this.powerChangedTrigger,
      'heating-dt-changed': this.heatingDtChangedTrigger,
      'source-dt-changed': this.sourceDtChangedTrigger,
    };

    const trigger = triggerMap[triggerId];
    if (trigger) {
      await trigger.trigger(device, tokens).catch(this.error);
    }
  }
};
