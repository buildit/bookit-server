import {Client} from '@microsoft/microsoft-graph-client';
import {AppConfig} from '../../config/config';
import {TokenOperations} from '../TokenOperations';

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

