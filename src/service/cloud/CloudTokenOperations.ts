import * as request from 'request';


import {RootLog as logger} from '../../utils/RootLogger';
import {GraphAPIParameters} from '../../model/EnvironmentConfig';
import {Credentials} from '../../model/Credentials';
import {TokenInfo} from '../../rest/auth_routes';
import {StubTokenOperations} from '../stub/StubTokenOperations';

/*
TODO: modify this to return the same token if it's still valid
 */
export class CloudTokenOperations extends StubTokenOperations {
  private token: string;

  constructor(private conf: GraphAPIParameters, jwtSecret: string) {
    super(jwtSecret);
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


}
