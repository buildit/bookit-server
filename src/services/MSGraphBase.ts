import {Client} from '@microsoft/microsoft-graph-client';

import {GraphTokenProvider} from './tokens/TokenProviders';

/**
 * This class will eventually be changed to not use the MS Graph Client as it is problematic
 */
export class MSGraphBase {

  private clientInst: Client;


  /*
   The type should stay cloud based as it's unlikely that part of cloud base we'd want to use anything other than
   a cloud token provider
   */
  constructor(protected tokenOperations: GraphTokenProvider) {
  }


  domain() {
    return this.tokenOperations.domain();
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
      debugLogging: true,
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

