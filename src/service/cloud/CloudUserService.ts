import {CloudBase} from './CloudBase';
import {UserService} from '../UserService';

export class CloudUsers extends CloudBase implements UserService {
  getUsers(): Promise<any> {
    return this.client.api('/users')
      .select('id,displayName,mail')
      .get() as Promise<any>;
  }
}

