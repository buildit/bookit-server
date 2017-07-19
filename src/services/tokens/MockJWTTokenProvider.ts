import * as jwt from 'jsonwebtoken';

import {JWTTokenProvider, AzureTokenProvider} from './TokenProviders';
import {Credentials} from '../../model/Credentials';

import {RootLog as logger} from '../../utils/RootLogger';
import {TokenInfo} from '../../rest/auth_routes';


export class MockJWTTokenProvider implements JWTTokenProvider {


  constructor(private jwtSecret: string, private openIdProvider: AzureTokenProvider) {
  }


  provideToken(credentials: Credentials): string {
    logger.trace('provide token:', this.jwtSecret);
    return jwt.sign(credentials, this.jwtSecret, { expiresIn: '60m' });
  }


  verify(token: string): Promise<Credentials> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err: any, decoded: any) => {
        if (err) {
          return reject(err);
        }

        const info = decoded as TokenInfo;
        console.info('validated token with user:', info.user);
        resolve(info);
      });
    });

  }

  decode(token: string): any {
    return jwt.decode(token);
  }

  // formatRSPublicKey(rawKey: string): string {
  //   return [
  //     '-----BEGIN CERTIFICATE-----',
  //     ...rawKey.match(/.{1,64}/g),
  //     '-----END CERTIFICATE-----'
  //   ].join('\n');
  // }
  //
  // async verifyOpenId(token: string): Promise<any> {
  //   const wellKnownConfig = await request.get('https://login.microsoftonline.com/common/.well-known/openid-configuration');
  //   const keysResponse = await request.get(wellKnownConfig.body.jwks_uri);
  //   const keys = keysResponse.body.keys;
  //
  //   return new Promise((resolve, reject) => {
  //     for (let thisKey of keys) {
  //       try {
  //         resolve(jwt.verify(token.toString(), this.formatRSPublicKey(thisKey.x5c[0]), {
  //           algorithms: ['RS256'],
  //         }));
  //       }
  //       catch (error) {
  //         // We don't want to reject here, because there's an array of keys provided, and the correct
  //         // one might be in the middle.
  //       }
  //     }
  //
  //     reject(false);
  //   });
  //
  // }
  async verifyOpenId(token: string): Promise<any> {
    const verified = await this.openIdProvider.verifyOpenIdToken(token);
    return new Promise((resolve, reject) => {
      resolve(verified);
    });
  }
}
