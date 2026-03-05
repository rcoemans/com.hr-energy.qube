'use strict';

import Homey from 'homey';

module.exports = class QubeApp extends Homey.App {

  // ── Trigger cards (WHEN) ────────────────────────────────────────

  private unitStatusChangedTrigger!: Homey.FlowCardTriggerDevice;
  private enteredHeatingTrigger!: Homey.FlowCardTriggerDevice;
  private enteredCoolingTrigger!: Homey.FlowCardTriggerDevice;
  private enteredDhwHeatingTrigger!: Homey.FlowCardTriggerDevice;
  private enteredStandbyTrigger!: Homey.FlowCardTriggerDevice;
  private enteredAlarmTrigger!: Homey.FlowCardTriggerDevice;
  private compressorStartingTrigger!: Homey.FlowCardTriggerDevice;
  private compressorShuttingDownTrigger!: Homey.FlowCardTriggerDevice;
  private compressorStartFailedTrigger!: Homey.FlowCardTriggerDevice;

  private globalAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private globalAlarmOffTrigger!: Homey.FlowCardTriggerDevice;
  private flowAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private heatingAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private coolingAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private sourceAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private userAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private legionellaTimeoutAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private dhwTimeoutAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private workingHoursAlarmOnTrigger!: Homey.FlowCardTriggerDevice;
  private anyAlarmOnTrigger!: Homey.FlowCardTriggerDevice;

  async onInit() {
    this.log('QubeApp has been initialized');

    // ── Register WHEN triggers ────────────────────────────────────
    this.unitStatusChangedTrigger = this.homey.flow.getDeviceTriggerCard('unit-status-changed');
    this.enteredHeatingTrigger = this.homey.flow.getDeviceTriggerCard('entered-heating');
    this.enteredCoolingTrigger = this.homey.flow.getDeviceTriggerCard('entered-cooling');
    this.enteredDhwHeatingTrigger = this.homey.flow.getDeviceTriggerCard('entered-dhw-heating');
    this.enteredStandbyTrigger = this.homey.flow.getDeviceTriggerCard('entered-standby');
    this.enteredAlarmTrigger = this.homey.flow.getDeviceTriggerCard('entered-alarm');
    this.compressorStartingTrigger = this.homey.flow.getDeviceTriggerCard('compressor-starting');
    this.compressorShuttingDownTrigger = this.homey.flow.getDeviceTriggerCard('compressor-shutting-down');
    this.compressorStartFailedTrigger = this.homey.flow.getDeviceTriggerCard('compressor-start-failed');

    this.globalAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('global-alarm-on');
    this.globalAlarmOffTrigger = this.homey.flow.getDeviceTriggerCard('global-alarm-off');
    this.flowAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('flow-alarm-on');
    this.heatingAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('heating-alarm-on');
    this.coolingAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('cooling-alarm-on');
    this.sourceAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('source-alarm-on');
    this.userAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('user-alarm-on');
    this.legionellaTimeoutAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('legionella-timeout-alarm-on');
    this.dhwTimeoutAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('dhw-timeout-alarm-on');
    this.workingHoursAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('working-hours-alarm-on');
    this.anyAlarmOnTrigger = this.homey.flow.getDeviceTriggerCard('any-alarm-on');

    // ── Register THEN actions ─────────────────────────────────────
    this.homey.flow.getActionCard('set-demand')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeDemand(args.value === '1');
      });

    this.homey.flow.getActionCard('set-season-mode')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeSeasonMode(args.value === '1');
      });

    this.homey.flow.getActionCard('force-dhw-program')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeForceDhwProgram(args.value === '1');
      });

    this.homey.flow.getActionCard('start-antilegionella')
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
        await device.getClient().writeHeatingSetpoint(args.temperature);
      });

    this.homey.flow.getActionCard('set-cooling-setpoint')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeCoolingSetpoint(args.temperature);
      });

    this.homey.flow.getActionCard('set-dhw-setpoint')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeDhwSetpoint(args.temperature);
      });

    this.homey.flow.getActionCard('set-heating-curve')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeHeatingCurve(args.value === '1');
      });

    this.homey.flow.getActionCard('write-modbus-register')
      .registerRunListener(async (args: any) => {
        const device = args.device as any;
        await device.getClient().writeAdvancedRegister(args.address, args.value, args.datatype);
      });
  }

  // ── Public methods called by device.ts ──────────────────────────

  async triggerUnitStatusChanged(device: Homey.Device, tokens: { old_status: string; new_status: string; raw_unitstatus: number; status_code: number }) {
    await this.unitStatusChangedTrigger.trigger(device, tokens).catch(this.error);

    const statusTriggerMap: Record<string, Homey.FlowCardTriggerDevice> = {
      heating: this.enteredHeatingTrigger,
      cooling: this.enteredCoolingTrigger,
      heating_dhw: this.enteredDhwHeatingTrigger,
      standby: this.enteredStandbyTrigger,
      alarm: this.enteredAlarmTrigger,
      compressor_startup: this.compressorStartingTrigger,
      compressor_shutdown: this.compressorShuttingDownTrigger,
      start_fail: this.compressorStartFailedTrigger,
    };

    const specificTrigger = statusTriggerMap[tokens.new_status];
    if (specificTrigger) {
      await specificTrigger.trigger(device).catch(this.error);
    }
  }

  async triggerGlobalAlarmChanged(device: Homey.Device, tokens: { alarm_on: boolean }) {
    if (tokens.alarm_on) {
      await this.globalAlarmOnTrigger.trigger(device).catch(this.error);
    } else {
      await this.globalAlarmOffTrigger.trigger(device).catch(this.error);
    }
  }

  async triggerAlarmOn(device: Homey.Device, alarmId: string) {
    const alarmTriggerMap: Record<string, Homey.FlowCardTriggerDevice> = {
      flow: this.flowAlarmOnTrigger,
      heating: this.heatingAlarmOnTrigger,
      cooling: this.coolingAlarmOnTrigger,
      source: this.sourceAlarmOnTrigger,
      user: this.userAlarmOnTrigger,
      legionella_timeout: this.legionellaTimeoutAlarmOnTrigger,
      dhw_timeout: this.dhwTimeoutAlarmOnTrigger,
      working_hours: this.workingHoursAlarmOnTrigger,
    };

    const trigger = alarmTriggerMap[alarmId];
    if (trigger) {
      await trigger.trigger(device).catch(this.error);
    }

    // Also fire the "any alarm" trigger with the alarm name as token
    const alarmName = this.homey.__(`alarms.${alarmId}`) || alarmId;
    await this.anyAlarmOnTrigger.trigger(device, { alarm_name: alarmName }).catch(this.error);
  }
};
