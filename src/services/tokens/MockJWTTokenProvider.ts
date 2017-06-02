import * as jwt from 'jsonwebtoken';

import {JWTTokenProvider} from './TokenProviders';
import {Credentials} from '../../model/Credentials';

import {RootLog as logger} from '../../utils/RootLogger';
import {TokenInfo} from '../../rest/auth_routes';


export class MockJWTTokenProvider implements JWTTokenProvider {


  constructor(private jwtSecret: string) {
  }

  provideToken(credentials: Credentials): string {
    logger.info('provide token:', this.jwtSecret);
    return jwt.sign(credentials, this.jwtSecret, { expiresIn: '60m' });
  }


  verify(token: string): Promise<TokenInfo> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err: any, decoded: any) => {
        if (err) {
          reject(err);
          return;
        }

        const info = decoded as TokenInfo;
        console.info('validated token with user:', info.user);
        resolve(info);
      });
    });

  }

}
