import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {DeviceService} from './DeviceService';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphDeviceService extends MSGraphBase implements DeviceService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphDeviceService');
  }


  getDevices(): Promise<any> {
    logger.info('Calling MS device service ');
    return this.client
               .api('/devices')
               // .select('id,displayName,mail')
               .get() as Promise<any>;
  }
}

