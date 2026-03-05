'use strict';

import Homey from 'homey';

module.exports = class QubeDriver extends Homey.Driver {
  async onInit() {
    this.log('QubeDriver has been initialized');
  }

  async onPair(session: Homey.Driver.PairSession) {
    session.setHandler('list_devices', async () => {
      return [
        {
          name: this.homey.__('device.pair_name'),
          data: {
            id: 'qube',
          },
        },
      ];
    });
  }
};
