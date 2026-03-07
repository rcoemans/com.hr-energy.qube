# HR-energy

[![Homey App](https://img.shields.io/badge/Homey-App%20Store-00A94F?logo=homey)](https://homey.app/en-nl/app/com.hr-energy.qube/HR-energy/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

Homey app for the **HR-energy Qube** heatpump. Communicates with the unit over **Modbus TCP** to read real-time sensor data, monitor alarms, control setpoints, and automate your heatpump directly from Homey.

## Disclaimer

> **This is an unofficial, community-developed integration.**
>
> - Not affiliated with, endorsed by, or supported by **HR-energy**.
> - HR-energy may change or discontinue these interfaces at any time without notice — app functionality may break as a result.
> - Use at your own risk. The developers accept no liability for data loss, incorrect readings, or unintended battery mode changes.

## Supported Devices

| Model                         | Modbus Support  | Notes                              |
|-------------------------------|-----------------|------------------------------------|
| Qube Heat Pump (all variants) | ✅             | Primary supported device           |
| Qube with Linq thermostat     | ✅             | Can disable Linq for Homey control |

## Firmware Compatibility

The integration is tested with current Qube firmware versions. If you encounter issues with a specific firmware version, please open an issue on GitHub with your firmware version and the problem description.

## Requirements

- Qube heatpump connected to your local network via **Ethernet**
- **Modbus TCP enabled** on the heatpump (default port: 502)
- Network access from Homey to the heatpump IP address

## Installation

### Via Homey App Store

Search for **"HR-energy"** in the Homey App Store.

### Via CLI (sideloading / development)

```bash
npm install -g homey
git clone https://github.com/rcoemans/com.hr-energy.qube
cd com.hr-energy.qube
homey login
homey app install
```

## Setup

1. Install the app on your Homey.
2. Add a new device: **HR-energy → Qube**.
3. The pairing wizard will ask for the **IP address**, **port** (default 502), **Modbus unit ID** (default 1), and **poll interval** (default 5000 ms). Enter the IP address of your Qube and adjust the other settings if needed.
4. Confirm the device to complete pairing.
5. The device will connect automatically and start reading data.
6. You can change connection settings later in the device **Settings** page.

## Device Variables

All capabilities exposed by the Qube device, with their variable name (as used in flows/tags) and data type.

Capabilities prefixed with `alarm_` or `measure_` are **device status indicators** — they appear on the device tile in the Homey app and can be selected by the user. All other capabilities are shown on the device detail page.

| Variable                         | Type          | Description                              | Indicator |
|----------------------------------|---------------|------------------------------------------|:---------:|
| `alarm_generic`                  | boolean       | Aggregated alarm (any alarm active)      | ✓         |
| `measure_compressor_speed`       | number        | Compressor speed (rpm)                   | ✓         |
| `measure_cop`                    | number        | Coefficient of Performance               | ✓         |
| `measure_flow`                   | number        | Water flow rate (l/min)                  | ✓         |
| `measure_heating_dt`             | number        | Heating ΔT (°C)                          | ✓         |
| `measure_power`                  | number        | Electric power (W)                       | ✓         |
| `measure_power_thermal`          | number        | Thermal power (W)                        | ✓         |
| `measure_runtime_efficiency`     | number        | Runtime efficiency (kWh/h)               | ✓         |
| `measure_source_dt`              | number        | Source ΔT (°C)                           | ✓         |
| `measure_temperature.dhw`        | number        | DHW temperature (°C)                     | ✓         |
| `measure_temperature.outdoor`    | number        | Outdoor temperature (°C)                 | ✓         |
| `measure_temperature.room`       | number        | Room temperature (°C)                    | ✓         |
| `qube_alarm_cooling`             | boolean       | Cooling alarm                            |           |
| `qube_alarm_dhw_timeout`         | boolean       | DHW timeout alarm                        |           |
| `qube_alarm_flow`                | boolean       | Flow alarm                               |           |
| `qube_alarm_global`              | boolean       | Global alarm                             |           |
| `qube_alarm_heating`             | boolean       | Heating alarm                            |           |
| `qube_alarm_legionella_timeout`  | boolean       | Legionella timeout alarm                 |           |
| `qube_alarm_source`              | boolean       | Source alarm                             |           |
| `qube_alarm_user`                | boolean       | User alarm                               |           |
| `qube_alarm_working_hours`       | boolean       | Working hours alarm                      |           |
| `qube_antilegionella_enabled`    | boolean       | Anti-legionella enabled                  |           |
| `qube_bms_demand`                | boolean       | BMS demand control status                |           |
| `qube_buffer_pump`               | boolean       | Buffer pump active                       |           |
| `qube_calc_cooling_setpoint`     | number        | Calculated cooling setpoint (°C)         |           |
| `qube_calc_dhw_setpoint`         | number        | Calculated DHW setpoint (°C)             |           |
| `qube_calc_hp_setpoint`          | number        | Calculated heat pump setpoint (°C)       |           |
| `qube_compressor_demand`         | number        | Compressor demand (%)                    |           |
| `qube_cooling_setpoint_day`      | number        | Cooling setpoint day (°C)                |           |
| `qube_cooling_setpoint_night`    | number        | Cooling setpoint night (°C)              |           |
| `qube_daynight_mode`             | boolean       | Day/night mode                           |           |
| `qube_dhw_controller_enabled`    | boolean       | DHW controller enabled                   |           |
| `qube_dhw_program_status`        | boolean       | DHW program active                       |           |
| `qube_dhw_setpoint`              | number        | DHW setpoint (°C)                        |           |
| `qube_energy_thermal`            | number        | Cumulative thermal energy (kWh)          |           |
| `qube_fourway_valve`             | boolean       | Four-way valve active                    |           |
| `qube_heater1`                   | boolean       | Backup heater 1 active                   |           |
| `qube_heater2`                   | boolean       | Backup heater 2 active                   |           |
| `qube_heater3`                   | boolean       | Backup heater 3 active                   |           |
| `qube_heating_curve_status`      | boolean       | Heating curve active                     |           |
| `qube_heating_setpoint_day`      | number        | Heating setpoint day (°C)                |           |
| `qube_heating_setpoint_night`    | number        | Heating setpoint night (°C)              |           |
| `qube_hours_cooling`             | number        | Working hours cooling (h)                |           |
| `qube_hours_dhw`                 | number        | Working hours DHW (h)                    |           |
| `qube_hours_heating`             | number        | Working hours heating (h)                |           |
| `qube_meter_electric`            | number        | Cumulative electric energy (kWh)         |           |
| `qube_pv_surplus`                | boolean       | PV surplus active                        |           |
| `qube_season_mode`               | enum (string) | Season mode (winter/summer)              |           |
| `qube_sg_ready_status`           | string        | SG Ready mode status                     |           |
| `qube_source_pump`               | boolean       | Source pump active                       |           |
| `qube_status`                    | string        | Unit status (decoded)                    |           |
| `qube_temp_return`               | number        | Return temperature (°C)                  |           |
| `qube_temp_source_in`            | number        | Source in temperature (°C)               |           |
| `qube_temp_source_out`           | number        | Source out temperature (°C)              |           |
| `qube_temp_supply`               | number        | Supply temperature (°C)                  |           |
| `qube_thermostat_demand`         | boolean       | Internal thermostat demand               |           |
| `qube_threeway_valve`            | boolean       | Three-way valve (CV/DHW) active          |           |
| `qube_unitstatus_raw`            | number        | Unit status (raw Modbus value)           |           |
| `qube_user_pump`                 | boolean       | CV pump active                           |           |

## Sensor Data (read-only)

All values are polled from the Qube's Modbus input registers and rounded to two decimals.

| Capability                  | Description                                         | Unit  |
|-----------------------------|-----------------------------------------------------|-------|
| Supply temperature          | Water temperature leaving the heatpump              | °C    |
| Return temperature          | Water temperature returning to the heatpump         | °C    |
| Source in temperature       | Source loop inlet temperature (ground/water source)  | °C    |
| Source out temperature      | Source loop outlet temperature                       | °C    |
| Room temperature            | Room temperature sensor reading                      | °C    |
| DHW temperature             | Domestic hot water tank temperature                  | °C    |
| Outdoor temperature         | Outside air temperature                              | °C    |
| Flow                        | Water flow rate through the system                   | l/min |
| COP                         | Coefficient of Performance — real-time efficiency    | —     |
| Electric power              | Current electrical power consumption                 | W     |
| Electric energy             | Cumulative electrical energy consumed                | kWh   |
| Thermal energy              | Cumulative thermal energy produced                   | kWh   |
| Thermal power               | Current thermal heat output                          | W     |
| Unit status                 | Decoded operating state (Standby, Heating, Cooling, DHW Heating, etc.) | — |
| Compressor speed            | Current compressor rotational speed                  | rpm   |
| Compressor demand           | Current compressor demand percentage                 | %     |
| Calculated HP setpoint      | Heat pump calculated supply setpoint                 | °C    |
| Calculated cooling setpoint | Active cooling setpoint calculated by controller     | °C    |
| Calculated DHW setpoint     | Active DHW setpoint calculated by controller         | °C    |
| Working hours DHW           | Cumulative compressor hours for domestic hot water   | h     |
| Working hours heating       | Cumulative compressor hours for central heating      | h     |
| Working hours cooling       | Cumulative compressor hours for cooling              | h     |
| Heating ΔT                  | Supply − Return temperature difference               | °C    |
| Source ΔT                   | Source In − Source Out temperature difference         | °C    |
| Runtime efficiency          | Thermal kWh / heating hours (long-term performance)  | kWh/h |

## Digital Outputs (read-only)

Real-time status of pumps, valves, and backup heaters — read from the Qube's discrete inputs.

| Capability                | Description                                                             |
|---------------------------|-------------------------------------------------------------------------|
| Source pump               | Source loop circulation pump active                                     |
| CV pump                   | Central heating circulation pump active                                 |
| Buffer pump               | Buffer tank circulation pump active                                     |
| Four-way valve            | Four-way reversing valve position                                       |
| Three-way valve (CV/DHW)  | Three-way valve directing flow to central heating or domestic hot water  |
| Heater 1                  | Backup electric heater step 1 active                                    |
| Heater 2                  | Backup electric heater step 2 active                                    |
| Heater 3                  | Backup electric heater step 3 active                                    |

## Control Status (read-only)

Boolean and string status indicators for control states, read from the Qube's Modbus registers.

| Capability                  | Description                                                          |
|-----------------------------|----------------------------------------------------------------------|
| Anti-legionella enabled     | Whether the anti-legionella function is active                       |
| BMS demand                  | Whether the BMS demand control is active                             |
| Day/night mode              | Current day or night operating mode                                  |
| DHW controller enabled      | Whether the DHW controller is active                                 |
| DHW program                 | Whether the DHW time program is active                               |
| Heating curve               | Whether the weather-dependent heating curve is active                |
| Internal thermostat demand  | Whether the internal thermostat is requesting heat                   |
| PV surplus active           | Whether PV surplus mode is active                                    |
| SG Ready mode               | Current SG Ready mode (Off, Block, Plus, Max)                        |

## Controls (read/write)

These capabilities appear on the device tile and can be changed directly from the Homey UI or via flow cards. The current value is read back from the heatpump during each poll cycle, so the UI always reflects the actual state.

| Capability                | Description | Type |
|---------------------------|-------------|---|
| Season mode               | Switch between **Winter (Heating)** and **Summer (Cooling)** mode. | Picker |
| Heating setpoint (day)    | Room heating setpoint for the day period. Range: 10–65 °C. | Slider |
| Heating setpoint (night)  | Room heating setpoint for the night period. Range: 10–65 °C. | Slider |
| Cooling setpoint (day)    | Room cooling setpoint for the day period. Range: 5–25 °C. | Slider |
| Cooling setpoint (night)  | Room cooling setpoint for the night period. Range: 5–25 °C. | Slider |
| DHW setpoint              | Target domestic hot water temperature. Range: 30–65 °C. | Slider |

## Alarms

Boolean indicators read from the Qube's discrete inputs. An **aggregated alarm** (`alarm_generic`) is provided that turns ON when any individual alarm is active. The **Alarm state changed** trigger fires whenever any alarm turns ON or OFF, providing the alarm name and state as tags.

| Alarm                | Description                                               |
|----------------------|-----------------------------------------------------------|
| Alarm active         | Aggregated alarm — ON when any alarm below is active      |
| Global alarm         | Master alarm — ON when any fault is active on the unit    |
| Flow alarm           | Water flow rate fault (check circulation pump and piping) |
| Heating alarm        | Fault in the heating circuit                              |
| Cooling alarm        | Fault in the cooling circuit                              |
| Source alarm         | Source loop fault (ground loop or groundwater issue)      |
| User alarm           | User-defined alarm condition                              |
| Legionella timeout   | Anti-legionella cycle exceeded maximum time               |
| DHW timeout          | DHW heating exceeded maximum time                         |
| Working hours        | Compressor working hours alarm (maintenance reminder)     |

## Flow Cards

### Triggers (WHEN…)

| Trigger                          | Description                              |
|----------------------------------|------------------------------------------|
| Unit status changed              | Fires when the operating state changes (e.g. Standby → Heating). Provides old/new status key, raw code, and text as tokens. |
| Alarm state changed              | Fires when any alarm turns ON or OFF. Provides alarm id, state, and description as tokens. |
| Supply temperature changed       | Fires when the supply temperature changes |
| Return temperature changed       | Fires when the return temperature changes |
| Source in temperature changed    | Fires when the source inlet temperature changes |
| Source out temperature changed   | Fires when the source outlet temperature changes |
| Room temperature changed         | Fires when the room temperature changes |
| DHW temperature changed          | Fires when the DHW temperature changes |
| Outdoor temperature changed      | Fires when the outdoor temperature changes |
| COP changed                      | Fires when the COP changes |
| Electric power changed           | Fires when the electric power consumption changes |
| Thermal power changed            | Fires when the thermal power output changes |
| Heating ΔT changed               | Fires when the heating circuit ΔT changes |
| Source ΔT changed                | Fires when the source-side ΔT changes |

### Auto-generated Triggers (Homey SDK)

The following trigger cards are **automatically generated by the Homey platform** for capabilities that use the standard `alarm_` and `measure_` prefixes (required for device status indicators). These cannot be removed without losing the indicator functionality.

| Trigger                                    | Source capability          |
|--------------------------------------------|----------------------------|
| The power changed                          | `measure_power`            |
| The generic alarm turned on                | `alarm_generic`            |
| The generic alarm turned off               | `alarm_generic`            |
| COP becomes greater than                   | `measure_cop`              |
| COP becomes less than                      | `measure_cop`              |
| Flow becomes greater than                  | `measure_flow`             |
| Flow becomes less than                     | `measure_flow`             |
| Runtime efficiency becomes greater than    | `measure_runtime_efficiency` |
| Runtime efficiency becomes less than       | `measure_runtime_efficiency` |
| Heating ΔT becomes greater than            | `measure_heating_dt`       |
| Heating ΔT becomes less than               | `measure_heating_dt`       |
| Source ΔT becomes greater than             | `measure_source_dt`        |
| Source ΔT becomes less than                | `measure_source_dt`        |
| Room temperature becomes greater than      | `measure_temperature.room` |
| Room temperature becomes less than         | `measure_temperature.room` |
| DHW temperature becomes greater than       | `measure_temperature.dhw`  |
| DHW temperature becomes less than          | `measure_temperature.dhw`  |
| Outdoor temperature becomes greater than   | `measure_temperature.outdoor` |
| Outdoor temperature becomes less than      | `measure_temperature.outdoor` |
| Electric power becomes greater than        | `measure_power`            |
| Electric power becomes less than           | `measure_power`            |
| Thermal power becomes greater than         | `measure_power_thermal`    |
| Thermal power becomes less than            | `measure_power_thermal`    |
| Compressor speed becomes greater than      | `measure_compressor_speed` |
| Compressor speed becomes less than         | `measure_compressor_speed` |

### Conditions (AND…)

| Condition                         | Description                              |
|-----------------------------------|------------------------------------------|
| Unit status is / is not …         | Checks if the current status matches a selected value |
| Alarm is / is not …              | Checks if a selected alarm is ON or OFF |
| Supply temperature is / is not … | Checks if the supply temperature is >, <, ≥, or ≤ a given value |
| Return temperature is / is not … | Checks if the return temperature matches |
| Source in temperature is / is not … | Checks if the source inlet temperature matches |
| Source out temperature is / is not … | Checks if the source outlet temperature matches |
| Room temperature is / is not …   | Checks if the room temperature matches |
| DHW temperature is / is not …    | Checks if the DHW temperature matches |
| Outdoor temperature is / is not … | Checks if the outdoor temperature matches |
| COP is / is not …                | Checks if the COP matches the condition |
| Electric power is / is not …     | Checks if the electric power matches |
| Thermal power is / is not …      | Checks if the thermal power matches |
| Heating ΔT is / is not …         | Checks if the heating circuit ΔT matches |
| Source ΔT is / is not …          | Checks if the source-side ΔT matches |

### Auto-generated Conditions (Homey SDK)

| Condition                | Source capability |
|--------------------------|-------------------|
| The generic alarm is on  | `alarm_generic`   |

### Actions (THEN…)

| Action                            | Description                                                                                     |
|-----------------------------------|-------------------------------------------------------------------------------------------------|
| Set BMS demand control            | Enable or disable the heatpump demand via Modbus                                                |
| Set season mode                   | Switch between Winter (Heating) and Summer (Cooling)                                            |
| Set heating setpoint              | Set the heating setpoint for day or night period (°C)                                           |
| Set cooling setpoint              | Set the cooling setpoint for day or night period (°C)                                           |
| Set DHW setpoint                  | Set the domestic hot water temperature setpoint (°C)                                            |
| Force DHW program                 | Forces the DHW time program to run once, overriding the normal schedule                         |
| Set DHW program                   | Enables or disables the DHW time program via BMS (ON/OFF)                                       |
| Force anti-legionella cycle       | Heats DHW tank to ~60 °C for disinfection (limited to once per day)                             |
| Set heating curve                 | Enable or disable the weather-dependent heating curve                                           |
| Set SG Ready mode                 | Set SG Ready mode (Off, Block, Plus, Max) — requires firmware ≥ 4.0.08                         |
| Write Modbus register (advanced)  | Write a raw value to any holding register (uint16, int16, or float32) — for advanced users only |

### Flow Card Variables (Tokens)

Some flow cards provide variables (tokens) that can be used in subsequent flow cards:

| Flow Card            | Token                | Type    | Description                        | Example   |
|----------------------|----------------------|---------|------------------------------------|-----------|
| Unit Status Changed  | `old_status`         | string  | Previous status key                | standby   |
| Unit Status Changed  | `new_status`         | string  | New status key                     | heating   |
| Unit Status Changed  | `old_status_text`    | string  | Previous human-readable status     | Standby   |
| Unit Status Changed  | `new_status_text`    | string  | New human-readable status          | Heating   |
| Unit Status Changed  | `old_raw_unitstatus` | number  | Previous raw numeric status code   | 1         |
| Unit Status Changed  | `new_raw_unitstatus` | number  | New raw numeric status code        | 16        |
| Alarm State Changed  | `alarm`              | string  | Alarm identifier                   | flow      |
| Alarm State Changed  | `state`              | boolean | Alarm active (true/false)          | true      |
| Alarm State Changed  | `alarm_text`         | string  | Localized alarm description        | Flow      |
| *-Changed triggers   | `value`              | number  | New metric value                   | 35.5      |

All sensor capabilities are also available as global tags in flows (e.g. Supply Temperature, COP, Electric Power, etc.).

## SG Ready

The Qube supports **SG Ready** signals for smart grid integration. This allows you to optimize energy consumption based on electricity prices or solar production.

| Mode      | Behavior                                                                       |
|-----------|--------------------------------------------------------------------------------|
| **Off**   | Normal operation                                                               |
| **Block** | Block heatpump operation (e.g. during peak tariff)                             |
| **Plus**  | Increased operation — regular heating curve, room setpoint +1K, DHW day mode   |
| **Max**   | Maximum operation — anti-legionella once, surplus curve, room setpoint +1K     |

> **Note**: SG Ready requires Qube firmware ≥ 4.0.08.

## Using Homey as the Thermostat Controller

The Qube heat pump can be controlled by different systems, such as the **HR Energy LinQ platform**, an external thermostat, or a **Modbus controller like Homey**. Only one controller should manage the heating and hot water demand to avoid conflicting commands.

If you want **Homey to control the heat pump**, the LinQ thermostat functions must be disabled on the heat pump controller.

### Disable LinQ control

On the heat pump controller disable the following options:

- **Room temperature control via LinQ**
- **DHW control via LinQ**

![Qube Linq thermostat configuration](assets/qube_heatpump_settings.png)

Disabling these options ensures that LinQ does not override the commands sent by Homey via Modbus.

### Controlling heating demand from Homey

Once LinQ control is disabled, Homey can act as a **virtual thermostat** for the heat pump.

Typical control logic is:

- Use the **Set BMS demand control** action in your Homey thermostat flows to start or stop heating demand via Modbus.
- Use the **Set DHW setpoint** action to control the desired domestic hot water temperature.
- Use heating and cooling setpoint actions to adjust room temperature targets if needed.

In this configuration:

- Homey decides **when heating should run**
- the Qube controller still manages **compressor operation, protection logic, and system safety**

This approach allows Homey to integrate the heat pump into automation flows (for example energy pricing, presence detection, or smart thermostats) while still relying on the Qube controller for safe operation.

### Important

- Only one system should control the heat pump demand at a time.
- If LinQ control remains enabled, it may override commands sent by Homey.

## Use Case Examples

### Alarm notifications

Use the **Alarm state changed** trigger with the `alarm_text` tag to send a notification:

- **WHEN** Alarm state changed → **AND** Alarm state is ON → **THEN** Send push notification: "Qube alarm: {{alarm_text}}"

### Smart grid / dynamic energy tariffs

Use SG Ready to shift consumption to low-tariff periods:

- **WHEN** Electricity price drops below €0.10/kWh → **THEN** Set SG Ready mode to **Plus**
- **WHEN** Electricity price rises above €0.30/kWh → **THEN** Set SG Ready mode to **Block**

### PV surplus heating

Boost DHW when excess solar power is available:

- **WHEN** Solar production exceeds 1500 W **AND** DHW Temperature is ≤ 55 °C → **THEN** Force DHW program
- **WHEN** Solar production drops below 500 W → **THEN** Set DHW program OFF

### Seasonal automation

Automatically switch between heating and cooling based on outdoor temperature:

- **WHEN** Outdoor temperature rises above 22 °C → **THEN** Set season mode to Summer
- **WHEN** Outdoor temperature drops below 18 °C → **THEN** Set season mode to Winter

## Device Settings

| Setting       | Default | Description                                      |
|---------------|---------|--------------------------------------------------|
| IP Address    | —       | IP address of the Qube heatpump (required)       |
| Port          | 502     | Modbus TCP port                                  |
| Unit ID       | 1       | Modbus slave/unit ID                             |
| Poll Interval | 5000    | Polling interval in milliseconds                 |

## Known Limitations

| Limitation                  | Description                                                                                        |
|-----------------------------|----------------------------------------------------------------------------------------------------|
| **Local network only**      | The Qube must be reachable on your local network. Modbus TCP does not support remote/cloud access. |
| **Unencrypted protocol**    | Modbus TCP has no encryption or authentication. Keep the heatpump on a trusted network segment.    |
| **No auto-discovery**       | The Qube cannot be automatically discovered. Manual IP configuration is required.                  |
| **Energy counter glitches** | The heatpump may occasionally report invalid energy values (a known hardware quirk).               |
| **Single device per entry** | Each paired device connects to one heatpump. Add multiple devices for multiple pumps.              |
| **SG Ready firmware**       | SG Ready mode requires Qube firmware ≥ 4.0.08.                                                     |
| **Re-pair after updates**   | After app updates that add new capabilities, you may need to remove and re-add the device.         |

## Security Considerations

- **Network**: Modbus TCP is unencrypted. The app assumes a trusted local network.
- **Write access**: The "Write Modbus register" action allows raw register writes for advanced users. Normal control should use the dedicated action cards.
- **No external connections**: All communication stays within your local network. The app makes no cloud or internet calls.

## Terminology

| Abbreviation | Meaning                                                                        |
|--------------|--------------------------------------------------------------------------------|
| **CH**       | Central Heating                                                                |
| **DHW**      | Domestic Hot Water (Dutch: SWW / Sanitair Warm Water)                          |
| **COP**      | Coefficient of Performance — ratio of heat output to electrical input          |
| **SG Ready** | Smart Grid Ready — standardized interface for grid-responsive heatpump control |
| **BMS**      | Building Management System — the Modbus control interface                      |
| **Linq**     | HR-energy's built-in thermostat system                                         |

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

Pull requests and issue reports are welcome on [GitHub](https://github.com/rcoemans/com.hr-energy.qube/issues).