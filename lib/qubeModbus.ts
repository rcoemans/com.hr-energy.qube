'use strict';


// modbus-serial does not ship proper TS types in all versions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ModbusRTU = require('modbus-serial');

export type QubePollResult = {
  flow: number;
  supplyTemp: number;
  returnTemp: number;
  sourceInTemp: number;
  sourceOutTemp: number;
  roomTemp: number;
  dhwTemp: number;
  outdoorTemp: number;

  unitStatusRaw: number;

  cop: number;
  electricPower: number;
  energyElectric: number;
  energyThermal: number;

  globalAlarm: boolean;
  alarmFlow: boolean;
  alarmHeating: boolean;
  alarmCooling: boolean;
  alarmSource: boolean;
  alarmUser: boolean;
  alarmLegionellaTimeout: boolean;
  alarmDhwTimeout: boolean;
  alarmWorkingHours: boolean;

  demand: boolean;
  seasonSummer: boolean;
  heatingSetpointDay: number;
  heatingSetpointNight: number;
  coolingSetpointDay: number;
  coolingSetpointNight: number;
  dhwSetpoint: number;

  thermalPower: number;
  compressorSpeed: number;
  hoursDhw: number;
  hoursHeating: number;
  hoursCooling: number;

  sourcePump: boolean;
  userPump: boolean;
  fourwayValve: boolean;
  threewayValve: boolean;
  heater1: boolean;
  heater2: boolean;

  heatingCurveEnabled: boolean;
};

type QubeModbusClientOptions = {
  ip: string;
  port: number;
  unitId: number;
};

function toFloat32BEFromRegs(regs: number[]): number {
  const b = Buffer.alloc(4);
  b.writeUInt16BE(regs[0] & 0xffff, 0);
  b.writeUInt16BE(regs[1] & 0xffff, 2);
  return b.readFloatBE(0);
}

function clampNumber(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v;
}

export class QubeModbusClient {
  private readonly ip: string;
  private readonly port: number;
  private readonly unitId: number;
  private client: any;

  constructor(opts: QubeModbusClientOptions) {
    this.ip = opts.ip;
    this.port = opts.port;
    this.unitId = opts.unitId;

    this.client = new ModbusRTU();
  }

  async connect() {
    await this.client.connectTCP(this.ip, { port: this.port });
    this.client.setID(this.unitId);
    this.client.setTimeout(4000);
  }

  async disconnect() {
    if (this.client?.close) {
      await this.client.close();
    }
  }

  async poll(): Promise<QubePollResult> {
    // Addresses in your table are 0-based indexes.
    // modbus-serial uses 0-based addressing as well.

    const flow = await this.readInputFloat32(18);
    const supplyTemp = await this.readInputFloat32(20);
    const returnTemp = await this.readInputFloat32(22);
    const sourceInTemp = await this.readInputFloat32(24);
    const sourceOutTemp = await this.readInputFloat32(26);
    const roomTemp = await this.readInputFloat32(28);
    const dhwTemp = await this.readInputFloat32(30);
    const outdoorTemp = await this.readInputFloat32(32);

    const cop = await this.readInputFloat32(34);

    const unitStatusRaw = await this.readInputUInt16(38);

    const electricPower = await this.readInputFloat32(61);
    const energyElectric = await this.readInputFloat32(69);
    const energyThermal = await this.readInputFloat32(71);

    // Coils – read back current control states
    const demand = await this.readCoilBit(19);
    const seasonSummer = await this.readCoilBit(22);

    // Holding registers – read back setpoints (day/night)
    const heatingSetpointDay = await this.readHoldingFloat32(27);
    const heatingSetpointNight = await this.readHoldingFloat32(29);
    const coolingSetpointDay = await this.readHoldingFloat32(31);
    const coolingSetpointNight = await this.readHoldingFloat32(33);
    const dhwSetpoint = await this.readHoldingFloat32(44);

    // Additional sensors – input registers
    const thermalPower = await this.readInputFloat32(36);
    const compressorSpeed = await this.readInputFloat32(45);  // raw Hz, ×60 → rpm
    const hoursDhw = await this.readInputUInt16(50);
    const hoursHeating = await this.readInputUInt16(52);
    const hoursCooling = await this.readInputUInt16(54);

    // Digital outputs – discrete inputs 0-8
    const sourcePump = await this.readDiscreteInputBit(0);
    const userPump = await this.readDiscreteInputBit(1);
    const fourwayValve = await this.readDiscreteInputBit(2);
    const threewayValve = await this.readDiscreteInputBit(4);
    const heater1 = await this.readDiscreteInputBit(6);
    const heater2 = await this.readDiscreteInputBit(7);

    // Heating curve enable – coil 62
    const heatingCurveEnabled = await this.readCoilBit(62);

    // Discrete Inputs – confirmed addresses from Qube Modbus PDF (202506)
    const alarmLegionellaTimeout = await this.readDiscreteInputBit(10); // Al_MaxTime_ANTILEG.Active
    const alarmDhwTimeout = await this.readDiscreteInputBit(11);        // Al_MaxTime_DHW.Active
    const alarmFlow = await this.readDiscreteInputBit(15);              // Alrm_Flw
    const alarmUser = await this.readDiscreteInputBit(16);              // UsrAlrms
    const alarmCooling = await this.readDiscreteInputBit(17);           // CoolingAlrms
    const alarmHeating = await this.readDiscreteInputBit(18);           // HeatingAlrms
    const alarmWorkingHours = await this.readDiscreteInputBit(19);      // AlarmMng.Al_WorkingHour
    const alarmSource = await this.readDiscreteInputBit(20);            // SrsAlrm
    const globalAlarm = await this.readDiscreteInputBit(21);            // GlbAl

    return {
      flow: clampNumber(flow),
      supplyTemp: clampNumber(supplyTemp),
      returnTemp: clampNumber(returnTemp),
      sourceInTemp: clampNumber(sourceInTemp),
      sourceOutTemp: clampNumber(sourceOutTemp),
      roomTemp: clampNumber(roomTemp),
      dhwTemp: clampNumber(dhwTemp),
      outdoorTemp: clampNumber(outdoorTemp),

      unitStatusRaw: clampNumber(unitStatusRaw),

      cop: clampNumber(cop),
      electricPower: clampNumber(electricPower),
      energyElectric: clampNumber(energyElectric),
      energyThermal: clampNumber(energyThermal),

      globalAlarm,
      alarmFlow,
      alarmHeating,
      alarmCooling,
      alarmSource,
      alarmUser,
      alarmLegionellaTimeout,
      alarmDhwTimeout,
      alarmWorkingHours,

      demand,
      seasonSummer,
      heatingSetpointDay: clampNumber(heatingSetpointDay),
      heatingSetpointNight: clampNumber(heatingSetpointNight),
      coolingSetpointDay: clampNumber(coolingSetpointDay),
      coolingSetpointNight: clampNumber(coolingSetpointNight),
      dhwSetpoint: clampNumber(dhwSetpoint),

      thermalPower: clampNumber(thermalPower),
      compressorSpeed: clampNumber(compressorSpeed * 60),
      hoursDhw: clampNumber(hoursDhw),
      hoursHeating: clampNumber(hoursHeating),
      hoursCooling: clampNumber(hoursCooling),

      sourcePump,
      userPump,
      fourwayValve,
      threewayValve,
      heater1,
      heater2,

      heatingCurveEnabled,
    };
  }

  private async readInputUInt16(address: number): Promise<number> {
    const res = await this.client.readInputRegisters(address, 1);
    return res.data[0];
  }

  private async readInputFloat32(address: number): Promise<number> {
    const res = await this.client.readInputRegisters(address, 2);
    return toFloat32BEFromRegs(res.data);
  }

  private async readDiscreteInputBit(address: number): Promise<boolean> {
    const res = await this.client.readDiscreteInputs(address, 1);
    return Boolean(res.data?.[0]);
  }

  private async readCoilBit(address: number): Promise<boolean> {
    const res = await this.client.readCoils(address, 1);
    return Boolean(res.data?.[0]);
  }

  private async readHoldingFloat32(address: number): Promise<number> {
    const res = await this.client.readHoldingRegisters(address, 2);
    return toFloat32BEFromRegs(res.data);
  }

  // ── Write helpers ──────────────────────────────────────────────────

  async writeCoil(address: number, value: boolean) {
    await this.client.writeCoil(address, value);
  }

  async writeHoldingUInt16(address: number, value: number) {
    await this.client.writeRegister(address, value);
  }

  async writeHoldingFloat32(address: number, value: number) {
    const b = Buffer.alloc(4);
    b.writeFloatBE(value, 0);
    const hi = b.readUInt16BE(0);
    const lo = b.readUInt16BE(2);
    await this.client.writeRegisters(address, [hi, lo]);
  }

  // ── Named write actions (addresses confirmed from Qube Modbus PDF 202506) ──

  /** Coil 19 – BMS_Demand: heat/cool demand via Modbus */
  async writeDemand(on: boolean) {
    await this.writeCoil(19, on);
  }

  /** Coil 22 – BMS_SummerWinter: false = Winter (Heating), true = Summer (Cooling) */
  async writeSeasonMode(summer: boolean) {
    await this.writeCoil(22, summer);
  }

  /** Coil 23 – TapW_TimeProgram.BMS_ForceTimeProgram: force DHW program */
  async writeForceDhwProgram(on: boolean) {
    await this.writeCoil(23, on);
  }

  /** Coil 62 – En_PlantSetp_Compens: enable/disable heating curve */
  async writeHeatingCurve(on: boolean) {
    await this.writeCoil(62, on);
  }

  /** Coil 45 – Antilegionella.FrcStart_ANTILEG_1: momentary trigger (max 1x/day) */
  async writeStartAntiLegionella() {
    await this.writeCoil(45, true);
  }

  /**
   * SG Ready – Coil 65 (A) + Coil 66 (B). Requires firmware ≥ 4.0.08.
   *   Off   → a=false b=false
   *   Block → a=true  b=false
   *   Plus  → a=false b=true
   *   Max   → a=true  b=true
   */
  async writeSgReadyMode(mode: 'off' | 'block' | 'plus' | 'max') {
    let a = false;
    let b = false;
    switch (mode) {
      case 'block': a = true;  b = false; break;
      case 'plus':  a = false; b = true;  break;
      case 'max':   a = true;  b = true;  break;
      default:      a = false; b = false; break;
    }
    await this.writeCoil(65, a);
    await this.writeCoil(66, b);
  }

  /** HoldingRegister 27 (2 regs, float32) – Heating day setpoint */
  async writeHeatingDaySetpoint(temp: number) {
    await this.writeHoldingFloat32(27, temp);
    // Also write active PID setpoint
    await this.writeHoldingFloat32(101, temp);
  }

  /** HoldingRegister 29 (2 regs, float32) – Heating night setpoint */
  async writeHeatingNightSetpoint(temp: number) {
    await this.writeHoldingFloat32(29, temp);
  }

  /** HoldingRegister 31 (2 regs, float32) – Cooling day setpoint */
  async writeCoolingDaySetpoint(temp: number) {
    await this.writeHoldingFloat32(31, temp);
    // Also write active PID setpoint
    await this.writeHoldingFloat32(103, temp);
  }

  /** HoldingRegister 33 (2 regs, float32) – Cooling night setpoint */
  async writeCoolingNightSetpoint(temp: number) {
    await this.writeHoldingFloat32(33, temp);
  }

  /** HoldingRegister 44 (2 regs, float32) – TapW_TimeProgram.DHWS (min DHW temp) */
  async writeDhwSetpoint(temp: number) {
    await this.writeHoldingFloat32(44, temp);
  }

  /** Advanced: raw holding register write with data-type selection */
  async writeAdvancedRegister(address: number, value: number, datatype: 'uint16' | 'int16' | 'float32') {
    switch (datatype) {
      case 'float32':
        await this.writeHoldingFloat32(address, value);
        break;
      case 'int16': {
        const signed = Math.max(-32768, Math.min(32767, Math.round(value)));
        const unsigned = signed < 0 ? signed + 65536 : signed;
        await this.writeHoldingUInt16(address, unsigned);
        break;
      }
      case 'uint16':
      default:
        await this.writeHoldingUInt16(address, Math.round(value) & 0xffff);
        break;
    }
  }
};
