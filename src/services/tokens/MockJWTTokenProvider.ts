import * as jwt from 'jsonwebtoken';

import {JWTTokenProvider, AzureTokenProvider} from './TokenProviders';
import {Credentials} from '../../model/Credentials';

import {RootLog as logger} from '../../utils/RootLogger';
import {TokenInfo} from '../../rest/auth_routes';


export class MockJWTTokenProvider implements JWTTokenProvider {
  private tokenMap = new Map<string, string>();

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

  async verifyOpenId(token: string): Promise<any> {
    const verified = await this.openIdProvider.verifyOpenIdToken(token);
    return new Promise((resolve, reject) => {
      resolve(verified);
    });
  }
}
