# HR-energy Qube Homey app

Homey app for the **HR-energy Qube** heatpump. Communicates with the unit over **Modbus TCP** to read real-time sensor data, monitor alarms, control setpoints, and automate your heatpump directly from Homey.

## Supported Devices

| Model | Modbus Support | Notes |
|---|---|---|
| Qube Heat Pump (all variants) | ✅ | Primary supported device |
| Qube with Linq thermostat | ✅ | Can disable Linq for Homey control |

## Requirements

- Qube heatpump connected to your local network via **Ethernet**
- **Modbus TCP enabled** on the heatpump (default port: 502)
- Network access from Homey to the heatpump IP address

## Setup

1. Install the app on your Homey.
2. Add a new device: **HR-energy → Qube**.
3. Go to the device **Settings** and enter the IP address of your Qube.
4. Optionally adjust port (default 502), Modbus unit ID (default 1), and poll interval (default 5 seconds).
5. The device will connect automatically and start reading data.

## Device Variables

All capabilities exposed by the Qube device, with their variable name (as used in flows/tags) and data type.

| Variable | Type |
|---|---|
| `alarm_generic` | boolean |
| `qube_unitstatus_raw` | number |
| `measure_temperature.dhw` | number |
| `measure_temperature.outdoor` | number |
| `measure_temperature.room` | number |
| `measure_cop` | number |
| `measure_power` | number |
| `qube_compressor_speed` | number |
| `qube_hours_dhw` | number |
| `qube_hours_heating` | number |
| `qube_hours_cooling` | number |
| `qube_season_mode` | enum (string) |
| `qube_heating_setpoint` | number |
| `qube_cooling_setpoint` | number |
| `qube_dhw_setpoint` | number |
| `qube_heating_curve` | boolean |
| `measure_temperature.supply` | number |
| `measure_temperature.return` | number |
| `measure_temperature.source_in` | number |
| `measure_temperature.source_out` | number |
| `qube_flow` | number |
| `qube_meter_electric` | number |
| `qube_energy_thermal` | number |
| `qube_power_thermal` | number |
| `qube_status` | string |
| `qube_source_pump` | boolean |
| `qube_user_pump` | boolean |
| `qube_fourway_valve` | boolean |
| `qube_threeway_valve` | boolean |
| `qube_heater1` | boolean |
| `qube_heater2` | boolean |
| `qube_alarm_flow` | boolean |
| `qube_alarm_heating` | boolean |
| `qube_alarm_cooling` | boolean |
| `qube_alarm_source` | boolean |
| `qube_alarm_user` | boolean |
| `qube_alarm_legionella_timeout` | boolean |
| `qube_alarm_dhw_timeout` | boolean |
| `qube_alarm_working_hours` | boolean |

## Sensor Data (read-only)

All values are polled from the Qube's Modbus input registers and rounded to two decimals.

| Capability | Description | Unit |
|---|---|---|
| Supply Temperature | Water temperature leaving the heatpump | °C |
| Return Temperature | Water temperature returning to the heatpump | °C |
| Source In Temperature | Source loop inlet temperature (ground/water source) | °C |
| Source Out Temperature | Source loop outlet temperature | °C |
| Room Temperature | Room temperature sensor reading | °C |
| DHW Temperature | Domestic hot water tank temperature | °C |
| Outdoor Temperature | Outside air temperature | °C |
| Flow | Water flow rate through the system | l/min |
| COP | Coefficient of Performance — indicates real-time efficiency. A COP of 4.0 means 4 kWh of heat for every 1 kWh of electricity consumed. | — |
| Electric Power | Current electrical power consumption | W |
| Electric Energy | Cumulative electrical energy consumed | kWh |
| Thermal Energy | Cumulative thermal energy produced | kWh |
| Unit Status | Decoded operating state (Standby, Heating, Cooling, DHW Heating, Compressor Starting, Compressor Shutting Down, Start Failed, Alarm) | — |
| Thermal Power | Current thermal heat output | W |
| Compressor Speed | Current compressor rotational speed | rpm |
| Working Hours DHW | Cumulative compressor hours for domestic hot water | h |
| Working Hours Heating | Cumulative compressor hours for central heating | h |
| Working Hours Cooling | Cumulative compressor hours for cooling | h |

## Digital Outputs (read-only)

Real-time status of pumps, valves, and backup heaters — read from the Qube's discrete inputs.

| Capability | Description |
|---|---|
| Source Pump | Source loop circulation pump active |
| CV Pump | Central heating circulation pump active |
| Four-way Valve | Four-way reversing valve position |
| Three-way Valve (CV/DHW) | Three-way valve directing flow to central heating or domestic hot water |
| Heater 1 | Backup electric heater step 1 active |
| Heater 2 | Backup electric heater step 2 active |

## Controls (read/write)

These capabilities appear on the device tile and can be changed directly from the Homey UI or via flow cards. The current value is read back from the heatpump during each poll cycle, so the UI always reflects the actual state.

| Capability | Description | Type |
|---|---|---|
| Season Mode | Switch between **Winter (Heating)** and **Summer (Cooling)** mode. In Winter mode the heatpump heats; in Summer mode it provides active cooling. | Picker |
| Heating Setpoint | Target water supply temperature for heating. Lower values (25–35 °C) are typical for underfloor heating; higher values (45–55 °C) for radiators. Range: 10–65 °C. | Slider |
| Cooling Setpoint | Target water supply temperature for cooling mode. Range: 10–65 °C. | Slider |
| DHW Setpoint | Target domestic hot water temperature. Typical range 45–55 °C. Higher values use more energy but reduce legionella risk. Range: 30–65 °C. | Slider |
| Heating Curve | Enable or disable the weather-dependent heating curve. When enabled, the heatpump automatically adjusts the supply temperature based on outdoor temperature. When disabled, the fixed Heating Setpoint is used. | Toggle |

## Alarms

Boolean indicators read from the Qube's discrete inputs. Each alarm has a corresponding flow trigger, and the **Any alarm ON** trigger catches all of them with the alarm name as a tag.

| Alarm | Description |
|---|---|
| Global Alarm | Master alarm — ON when any fault is active on the unit |
| Flow Alarm | Water flow rate fault (check circulation pump and piping) |
| Heating Alarm | Fault in the heating circuit |
| Cooling Alarm | Fault in the cooling circuit |
| Source Alarm | Source loop fault (ground loop or groundwater issue) |
| User Alarm | User-defined alarm condition |
| Legionella Timeout | Anti-legionella cycle exceeded maximum time |
| DHW Timeout | DHW heating exceeded maximum time |
| Working Hours | Compressor working hours alarm (maintenance reminder) |

## Flow Cards

### Triggers (WHEN…)

| Trigger | Description |
|---|---|
| Unit status changed | Fires when the operating state changes (e.g. Standby → Heating). Provides old status, new status, and raw status code as tokens. |
| Entered standby | Unit entered standby mode |
| Entered heating | Unit entered heating mode |
| Entered cooling | Unit entered cooling mode |
| Entered DHW heating | Unit started heating domestic hot water |
| Entered alarm | Unit entered alarm state |
| Compressor starting | Compressor is starting up |
| Compressor shutting down | Compressor is shutting down |
| Compressor start failed | Compressor failed to start |
| Global alarm ON / OFF | Global alarm activated or cleared |
| Flow alarm ON | Flow alarm activated |
| Heating alarm ON | Heating alarm activated |
| Cooling alarm ON | Cooling alarm activated |
| Source alarm ON | Source alarm activated |
| User alarm ON | User alarm activated |
| Legionella timeout alarm ON | Legionella timeout alarm activated |
| DHW timeout alarm ON | DHW timeout alarm activated |
| Working hours alarm ON | Working hours alarm activated |
| **Any alarm ON** | Fires when any alarm activates. Provides the alarm name as a tag — ideal for a single notification flow covering all alarms. |

### Actions (THEN…)

| Action | Description |
|---|---|
| Set demand (ON/OFF) | Enable or disable the heatpump demand via Modbus (BMS demand) |
| Set season mode | Switch between Winter (Heating) and Summer (Cooling) |
| Set heating setpoint | Set the heating supply temperature setpoint (°C) |
| Set cooling setpoint | Set the cooling supply temperature setpoint (°C) |
| Set DHW setpoint | Set the domestic hot water temperature setpoint (°C) |
| Force DHW program (ON/OFF) | Force the DHW time program via BMS — useful for boosting hot water on demand |
| Start anti-legionella cycle | Manually trigger an anti-legionella disinfection cycle (max once per day) |
| Set heating curve | Enable or disable the weather-dependent heating curve |
| Set SG Ready mode | Set SG Ready mode (see below) — requires firmware ≥ 4.0.08 |
| Write Modbus register (Advanced) | Write a raw value to any holding register (uint16, int16, or float32) — for advanced users only |

### Flow Card Variables (Tokens)

Some flow cards provide variables (tokens) that can be used in subsequent flow cards:

| Flow Card | Token | Type | Description | Example |
|---|---|---|---|---|
| Unit status changed | `old_status` | string | Previous operating state | Standby |
| Unit status changed | `new_status` | string | New operating state | Heating |
| Unit status changed | `raw_unitstatus` | number | Raw numeric status code | 1 |
| Any alarm ON | `alarm_name` | string | Name of the alarm that activated | Flow |

All sensor capabilities are also available as global tags in flows (e.g. Supply Temperature, COP, Electric Power, etc.).

## SG Ready

The Qube supports **SG Ready** signals for smart grid integration. This allows you to optimize energy consumption based on electricity prices or solar production.

| Mode | Behavior |
|---|---|
| **Off** | Normal operation |
| **Block** | Block heatpump operation (e.g. during peak tariff) |
| **Plus** | Increased operation — regular heating curve, room setpoint +1K, DHW day mode |
| **Max** | Maximum operation — anti-legionella once, surplus curve, room setpoint +1K |

> **Note**: SG Ready requires Qube firmware ≥ 4.0.08.

## Use Case Examples

### Alarm notifications
Use the **Any alarm ON** trigger with the `alarm_name` tag to send a notification:
- **WHEN** Any alarm ON → **THEN** Send push notification: "Qube alarm: {{alarm_name}}"

### Smart grid / dynamic energy tariffs
Use SG Ready to shift consumption to low-tariff periods:
- **WHEN** Electricity price drops below €0.10/kWh → **THEN** Set SG Ready mode to **Plus**
- **WHEN** Electricity price rises above €0.30/kWh → **THEN** Set SG Ready mode to **Block**

### PV surplus heating
Boost DHW when excess solar power is available:
- **WHEN** Solar production exceeds 1500 W **AND** DHW temperature is below 55 °C → **THEN** Force DHW program ON
- **WHEN** Solar production drops below 500 W → **THEN** Force DHW program OFF

### Seasonal automation
Automatically switch between heating and cooling based on outdoor temperature:
- **WHEN** Outdoor temperature rises above 22 °C → **THEN** Set season mode to Summer
- **WHEN** Outdoor temperature drops below 18 °C → **THEN** Set season mode to Winter

### Virtual thermostat control
If you want Homey to control the Qube instead of the built-in Linq thermostat:
1. On the heatpump controller, disable room temperature control and DHW control via Linq.
2. Use the **Set demand** action in your thermostat flows to trigger heat demand via Modbus.
3. Use the **Set DHW setpoint** action to control hot water temperature.

## Device Settings

| Setting | Default | Description |
|---|---|---|
| IP Address | — | IP address of the Qube heatpump (required) |
| Port | 502 | Modbus TCP port |
| Unit ID | 1 | Modbus slave/unit ID |
| Poll Interval | 5000 | Polling interval in milliseconds |

## Known Limitations

| Limitation | Description |
|---|---|
| **Local network only** | The Qube must be reachable on your local network. Modbus TCP does not support remote/cloud access. |
| **Unencrypted protocol** | Modbus TCP has no encryption or authentication. Keep the heatpump on a trusted network segment. |
| **No auto-discovery** | The Qube cannot be automatically discovered. Manual IP configuration is required. |
| **Energy counter glitches** | The heatpump may occasionally report invalid energy values (a known hardware quirk). |
| **Single device per entry** | Each paired device connects to one heatpump. Add multiple devices for multiple pumps. |
| **SG Ready firmware** | SG Ready mode requires Qube firmware ≥ 4.0.08. |
| **Re-pair after updates** | After app updates that add new capabilities, you may need to remove and re-add the device. |

## Security Considerations

- **Network**: Modbus TCP is unencrypted. The app assumes a trusted local network.
- **Write access**: The "Write Modbus register" action allows raw register writes for advanced users. Normal control should use the dedicated action cards.
- **No external connections**: All communication stays within your local network. The app makes no cloud or internet calls.

## Terminology

| Abbreviation | Meaning |
|---|---|
| **CH** | Central Heating |
| **DHW** | Domestic Hot Water (Dutch: SWW / Sanitair Warm Water) |
| **COP** | Coefficient of Performance — ratio of heat output to electrical input |
| **SG Ready** | Smart Grid Ready — standardized interface for grid-responsive heatpump control |
| **BMS** | Building Management System — the Modbus control interface |
| **Linq** | HR-energy's built-in thermostat system |

## Technical Details

- **Protocol**: Modbus TCP
- **SDK**: Homey SDK v3
- **Communication**: Input registers (sensor data), discrete inputs (alarms), coils (boolean controls), holding registers (setpoints)
- **Reconnect**: Automatic reconnection after 3 consecutive polling failures
- **Languages**: English (en), Nederlands (nl)

## Credits & Acknowledgements

This Homey app was inspired by the excellent work of **[Mattie](https://github.com/MattieGit)**, who created the [Qube Heat Pump integration for Home Assistant](https://github.com/MattieGit/qube_heatpump). His project provided valuable insights into the Qube's Modbus register map and control capabilities.

This app is a co-creation between **Robert Coemans** and **Claude Opus** (Anthropic), built using **[Windsurf](https://windsurf.com)** — an AI-powered IDE for collaborative software development.

If you like this, consider [buying me a coffee](https://buymeacoffee.com/kabxpqqg7z). 