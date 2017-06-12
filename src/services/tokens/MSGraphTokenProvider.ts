import * as request from 'request';

import {RootLog as logger} from '../../utils/RootLogger';

import {Domain, GraphAPIParameters} from '../../model/EnvironmentConfig';
import {GraphTokenProvider} from './TokenProviders';


export class MSGraphTokenProvider implements GraphTokenProvider {
  private token: string;
  private tokenEndpoint: string;

  constructor(private _conf: GraphAPIParameters, private _domain: Domain, private _reuseTokens = false) {
    this.tokenEndpoint = 'https://login.windows.net/' + _conf.tenantId + '/oauth2/token';
  }


  domain(): string {
    return this._domain.domainName;
  }


  public hasToken(): boolean {
    return !!this.token; // WebStorm inspection
  }


  public getCurrentToken(): string {
    return this.token;
  }


  public withToken(): Promise<string> {
    if (this.token) {
      return this.resolveExisting();
    } else {
      return this.acquireNew();
    }
  }


  private resolveExisting() {
    return Promise.resolve(this.token);
  }


  private acquireNew() {
    const clearToken = (_timeout: string) => {
      if (this._reuseTokens) {
        const timeout = (Number(_timeout) - 10) * 1000;
        setTimeout(() => this.token = null, timeout);
      }
    };

    return new Promise((resolve, reject) => {
      const params = {
        client_id: this._conf.clientId,
        client_secret: this._conf.clientSecret,
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
          this.token = data.access_token;
          clearToken(data.expires_in);
          resolve(this.token);
        }
      });
    });
  }

}
