import {Client} from '@microsoft/microsoft-graph-client'
import {Meetings} from '../Meetings';
import {Meeting} from '../../model/Meeting';
import {TokenOperations} from '../TokenOperations';
import {AppConfig} from '../../config/config';

const tokenOperations = new TokenOperations(AppConfig.graphApi);

export class CloudBase {
  protected  client: Client = Client.init({
      debugLogging: true,
      authProvider: (done) => {
        tokenOperations.withToken()
          .then(token => done(null, token))
          .catch(err => {
            done(err, null);
          });
      }
    });
}

