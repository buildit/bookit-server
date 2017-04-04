import {CloudBase} from './CloudBase';

export class CloudUsers extends CloudBase {
  getUsers(): Promise<any> {
    return this.client.api('/users')
      .select('id,displayName,mail')
      .get() as Promise<any>;
  }
}

