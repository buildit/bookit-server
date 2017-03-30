import {Client} from '@microsoft/microsoft-graph-client'
import {Meetings} from '../Meetings';
import {Meeting} from '../../model/Meeting';
import {TokenOperations} from '../TokenOperations';
import {AppConfig} from '../../config/config';
import {CloudBase} from './CloudBase';

const tokenOperations = new TokenOperations(AppConfig.graphApi);

export class CloudUsers extends CloudBase {
  getUsers(): Promise<any> {
    return this.client.api('/users')
      .select('id,displayName')
      .get() as Promise<any>;
  }
}

