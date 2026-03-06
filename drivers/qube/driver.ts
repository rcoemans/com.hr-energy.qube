'use strict';

import Homey from 'homey';

module.exports = class QubeDriver extends Homey.Driver {
  async onInit() {
    this.log('QubeDriver has been initialized');
  }

  async onPair(session: Homey.Driver.PairSession) {
    let pairSettings = {
      ip: '',
      port: 502,
      unitId: 1,
      pollIntervalMs: 5000,
    };

    session.setHandler('configure_ip', async (data: { ip: string; port: number; unitId: number; pollIntervalMs: number }) => {
      const ip = (data.ip || '').trim();
      if (!ip) {
        throw new Error(this.homey.__('errors.ip_required'));
      }
      pairSettings = {
        ip,
        port: data.port || 502,
        unitId: data.unitId || 1,
        pollIntervalMs: data.pollIntervalMs || 5000,
      };
    });

    session.setHandler('list_devices', async () => {
      return [
        {
          name: this.homey.__('device.pair_name'),
          data: {
            id: `qube-${Date.now()}`,
          },
          settings: pairSettings,
        },
      ];
    });
  }
};
