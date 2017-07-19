import * as request from 'superagent';
import * as jwt from 'jsonwebtoken';

import {AzureTokenProvider} from './TokenProviders';

export class MockAzureAuthTokenProvider implements AzureTokenProvider {

  async verifyOpenIdToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve(jwt.decode(token));
    });
  }

}
