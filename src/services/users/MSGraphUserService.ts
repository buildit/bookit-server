import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {MSUser, UserService} from './UserService';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphUserService extends MSGraphBase implements UserService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphUserService');
  }


  getUsers(): Promise<Array<MSUser>> {
    logger.info('Calling MS user service ');
    return this.client
               .api('/users')
               // .select('id,displayName,mail')
               .get()
               .then(response => { return response.value; }) as Promise<any>;
  }

  getDevices(userId: string): Promise<Array<any>> {
    return this.client
               .api(`/users/${userId}/ownedDevices`)
               // .select('id,displayName,mail')
               .get() as Promise<any>;
  }

}

