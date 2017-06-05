import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../cloud/MSGraphBase';
import {UserService} from './UserService';

export class MSGraphUserService extends MSGraphBase implements UserService {
  getUsers(): Promise<any> {
    logger.info('Calling MS user service ');
    return this.client
               .api('/users')
               .select('id,displayName,mail')
               .get() as Promise<any>;
  }
}

