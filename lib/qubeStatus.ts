'use strict';

export function decodeUnitStatus(unitStatusRaw: number, globalAlarm: boolean): string {
  if (globalAlarm) return 'alarm';

  switch (unitStatusRaw) {
    case 0:
      return 'standby';
    case 1:
      return 'heating';
    case 2:
      return 'cooling';
    case 3:
      return 'heating_dhw';
    case 4:
      return 'compressor_startup';
    case 5:
      return 'compressor_shutdown';
    case 6:
      return 'start_fail';
    default:
      return 'unknown';
  }
}
