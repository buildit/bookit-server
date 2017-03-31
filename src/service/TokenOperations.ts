import * as request from 'request';
import {ApiSecret} from '../model/ConfigRoot';

export class TokenOperations {
  constructor(private conf: ApiSecret) {
  }

  public withToken(): Promise<string> {

    return new Promise((resolve, reject) => {

      const params = {
        client_id: this.conf.clientId,
        client_secret: this.conf.clientSecret,
        grant_type: 'client_credentials',
        resource: 'https://graph.microsoft.com',
      };

      request.post({url: this.conf.tokenEndpoint, form: params}, (err, response, body) => {

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
