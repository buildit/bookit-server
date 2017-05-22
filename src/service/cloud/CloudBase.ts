import {Client} from '@microsoft/microsoft-graph-client';

import {CloudTokenOperations} from './CloudTokenOperations';

/**
 * A base class for encapsulating required
 */
export class CloudBase {

  private clientInst: Client;


  /*
   The type should stay cloud based as it's unlikely that part of cloud base we'd want to use anything other than
   a cloud token provider
   */
  constructor(private tokenOperations: CloudTokenOperations) {
  }


  private createClient(): Client {

    const authProviderCallback = (done: Function) => {
      this.tokenOperations
          .withToken()
          .then(token => done(null, token))
          .catch(err => {
            done(err, null);
          });
    };

    return Client.init({
      debugLogging: false,
      authProvider: authProviderCallback
    });
  }


  get client(): Client {
    if (!this.clientInst) {
      this.clientInst = this.createClient();
    }
    return this.clientInst;
  }
}

