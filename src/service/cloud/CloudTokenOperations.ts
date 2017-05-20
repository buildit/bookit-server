import * as request from 'request';
import * as jwt from 'jsonwebtoken';


import {RootLog as logger} from '../../utils/RootLogger';
import {GraphAPIParameters} from '../../model/EnvironmentConfig';
import {TokenOperations} from '../TokenOperations';
import {Credentials} from '../../model/Credentials';

/*
TODO: modify this to return the same token if it's still valid
 */
export class CloudTokenOperations implements TokenOperations {
  private token: string;

  constructor(private conf: GraphAPIParameters, private jwtSecret: string) {
  }


  public hasToken(): boolean {
    return !!this.token; // WebStorm inspection
  }


  public getCurrentToken(): string {
    return this.token;
  }


  public withToken(): Promise<string> {

    return new Promise((resolve, reject) => {
      const params = {
        client_id: this.conf.clientId,
        client_secret: this.conf.clientSecret,
        grant_type: 'client_credentials',
        resource: 'https://graph.microsoft.com',
      };

      const tokenRequest = {url: this.conf.tokenEndpoint, form: params};

      request.post(tokenRequest, (err, response, body) => {
        const data = JSON.parse(body);

        if (err) {
          reject(err);
        } else if (data.error) {
          reject(data.error_description);
        } else {
          resolve(data.access_token);
        }
      });
    });
  }


  provideToken(credentials: Credentials): string {
    return jwt.sign(credentials, this.jwtSecret, { expiresIn: '60m' });
  }


  verify(token: string): Promise<Credentials> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err: any, decoded: any) => {
        if (err) {
          return reject(err);
        }

        resolve(decoded);
      });
    });

  }
}
