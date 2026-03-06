'use strict';

/**
 * Mapping from raw Modbus unit-status register (1-22) to a canonical status key.
 *
 *   1, 14, 18 → standby
 *   2         → alarm
 *   6         → keyboard_off
 *   8         → compressor_startup
 *   9         → compressor_shutdown
 *  15         → cooling
 *  16         → heating
 *  17         → start_fail
 *  22         → heating_dhw
 */

const RAW_STATUS_MAP: Record<number, string> = {
  1:  'standby',
  2:  'alarm',
  6:  'keyboard_off',
  8:  'compressor_startup',
  9:  'compressor_shutdown',
  14: 'standby',
  15: 'cooling',
  16: 'heating',
  17: 'start_fail',
  18: 'standby',
  22: 'heating_dhw',
};

export function decodeUnitStatus(unitStatusRaw: number): string {
  return RAW_STATUS_MAP[unitStatusRaw] ?? 'unknown';
}

/** Human-readable status text map (English) – used for the status_text token */
export const STATUS_TEXT_MAP: Record<string, { en: string; nl: string }> = {
  standby:              { en: 'Standby',                    nl: 'Stand-by' },
  heating:              { en: 'Heating',                    nl: 'Verwarmen' },
  cooling:              { en: 'Cooling',                    nl: 'Koelen' },
  heating_dhw:          { en: 'DHW Heating',                nl: 'Warmwater verwarmen' },
  alarm:                { en: 'Alarm',                      nl: 'Alarm' },
  compressor_startup:   { en: 'Compressor Starting',        nl: 'Compressor start' },
  compressor_shutdown:  { en: 'Compressor Shutting Down',   nl: 'Compressor stopt' },
  start_fail:           { en: 'Compressor Start Failed',    nl: 'Compressor start mislukt' },
  keyboard_off:         { en: 'Keyboard Off',               nl: 'Toetsenbord uit' },
  unknown:              { en: 'Unknown',                    nl: 'Onbekend' },
};
