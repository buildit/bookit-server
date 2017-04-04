import {Client} from '@microsoft/microsoft-graph-client';
import {ApiSecret} from '../../model/ConfigRoot';
import {TokenOperations} from '../TokenOperations';


export class CloudBase {

  private tokenOperations: TokenOperations;
  private clientInst: Client;

  constructor(private secret: ApiSecret) {
    this.tokenOperations = new TokenOperations(this.secret);
  }

  private createClient(): Client {
    return Client.init({
      debugLogging: true,
      authProvider: (done) => {
        this.tokenOperations.withToken()
          .then(token => done(null, token))
          .catch(err => {
            done(err, null);
          });
      }
    });
  }

  get client(): Client {
    if (!this.clientInst) {
      this.clientInst = this.createClient();
    }
    return this.clientInst;
  }
}

