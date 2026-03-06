HR-energy integration for Homey.

Control and monitor your HR-energy Qube heatpump directly from Homey via Modbus TCP.

Features:
- Real-time sensor data: supply, return, source in/out, room, DHW, and outdoor temperatures
- Derived metrics: Heating ΔT (supply − return), Source ΔT (source in − source out), Runtime efficiency (thermal kWh / heating hours)
- Water flow rate, COP (efficiency), electric and thermal power, energy consumption
- Thermal energy production monitoring
- Compressor speed and working hours (DHW, heating, cooling)
- Digital output status: source pump, CV pump, valves, backup heaters
- Season mode control (Winter/Summer)
- Day/night heating and cooling setpoint adjustment
- DHW setpoint adjustment
- 9 alarm indicators (global, flow, heating, cooling, source, user, legionella timeout, DHW timeout, working hours)
- Accurate unit status decoding using raw Modbus values 1–22 (standby, heating, cooling, DHW heating, alarm, keyboard off, compressor startup/shutdown, start fail)
- 14 flow trigger cards: unit status changed, alarm state changed (with ON/OFF tags), plus per-metric change triggers for all temperatures, COP, power, and derived metrics
- 14 flow condition cards: unit status is, alarm is ON/OFF, plus operator-based conditions (>, <, ≥, ≤) for all temperatures, COP, power, and derived metrics
- 11 flow action cards: BMS demand control, season mode, heating/cooling setpoints (day/night), DHW setpoint, force DHW program, set DHW program ON/OFF, force anti-legionella cycle, heating curve, SG Ready mode, advanced Modbus write
- Fully localized in English and Dutch (Nederlands)

Supported devices:
- HR-energy Qube heatpump (Modbus TCP connection required)

Setup:
1. Install the app on your Homey
2. Add a new device: HR-energy > Qube
3. The pairing wizard asks for IP address, port (default 502), Modbus unit ID (default 1), and poll interval (default 5000 ms)
4. Confirm the device to complete pairing
5. The device will connect automatically and start reading data
6. Connection settings can be changed later in device Settings

Known limitations:
- The Qube must be reachable on your local network via Modbus TCP
- SG Ready mode requires Qube firmware >= 4.0.08
- Heating/cooling setpoints (day/night) only apply when the internal thermostat is active; external thermostats or heating curve compensation may override them
- After app updates, you may need to remove and re-add the device for new capabilities to appear