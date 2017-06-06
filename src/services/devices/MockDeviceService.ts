import {RootLog as logger} from '../../utils/RootLogger';

import {DeviceService} from './DeviceService';

export class MockDeviceService implements DeviceService {
  constructor() {
    logger.info('MockDeviceService: initializing');
  }


  getDevices(): Promise<any> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }
}

