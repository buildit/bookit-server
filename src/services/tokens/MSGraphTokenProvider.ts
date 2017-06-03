import * as request from 'request';


import {GraphAPIParameters} from '../../model/EnvironmentConfig';
import {GraphTokenProvider} from './TokenProviders';

/*
TODO: modify this to return the same token if it's still valid
 */
export class MSGraphTokenProvider implements GraphTokenProvider {
  private token: string;
  private tokenEndpoint: string;

  constructor(private conf: GraphAPIParameters) {
    this.tokenEndpoint = 'https://login.windows.net/' + conf.tenantId + '/oauth2/token';
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

      const tokenRequest = {url: this.tokenEndpoint, form: params};

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
