import * as request from 'superagent';
import * as jwt from 'jsonwebtoken';

import {AzureTokenProvider} from './TokenProviders';

const wellKnownConfigUrl = 'https://login.microsoftonline.com/common/.well-known/openid-configuration';

export class AzureAuthTokenProvider implements AzureTokenProvider {

  async retrieveKeys(): Promise<any> {
    const config = await request.get(wellKnownConfigUrl);
    const keysResponse = await request.get(config.body.jwks_uri);
    return keysResponse.body.keys
  }

  formatRSPublicKey(rawKey: string): string {
    return [
      '-----BEGIN CERTIFICATE-----',
      ...rawKey.match(/.{1,64}/g),
      '-----END CERTIFICATE-----'
    ].join('\n');
  }

  async verifyOpenIdToken(token: string): Promise<any> {
    const keys = await this.retrieveKeys();
    return new Promise((resolve, reject) => {
      for (let thisKey of keys) {
        try {
          resolve(jwt.verify(token.toString(), this.formatRSPublicKey(thisKey.x5c[0]), {
            algorithms: ['RS256'],
          }));
        }
        catch (error) {
          // We don't want to reject here, because there's an array of keys provided, and the correct
          // one might be in the middle.
        }
      }

      reject(false);
    });
  }
}
