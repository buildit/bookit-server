import * as request from 'request';
import {IConfig} from '../config';
/**
 * Created by romansafronov on 3/28/17.
 */

export class TokenOperations {
  constructor(private conf: IConfig) {
  }

  public withToken(): Promise<string> {
    const params = {
      client_id: this.conf.clientId,
      client_secret: this.conf.clientSecret,
      grant_type: 'client_credentials',
      resource: 'https://graph.microsoft.com',
    };

    return new Promise((resolve, reject) => {
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
