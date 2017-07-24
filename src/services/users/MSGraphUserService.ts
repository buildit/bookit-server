import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';
import {MSGraphBase} from '../MSGraphBase';
import {MSUser, UserService} from './UserService';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphUserService extends MSGraphBase implements UserService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphUserService');
  }

  getDevices(userId: string): Promise<Array<any>> {
    return this.client
               .api(`/users/${userId}/ownedDevices`)
               // .select('id,displayName,mail')
               .get() as Promise<any>;
  }

  getUsers(): Promise<any> {
    const bookitServiceUserId = 'roodmin@builditcontoso.onmicrosoft.com'

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/${bookitServiceUserId}/contacts`;
      console.info('GET', URL);
      this.tokenOperations.withToken()
          .then(token => {
            request.get(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(error);
                       return;
                     }
                     resolve(response.body);
                   });
          })
          .catch(error => {
            reject(error)
          });
    });
  }

  postUser(userEmail: string): Promise<any> {
    const bookitServiceUserId = 'roodmin@builditcontoso.onmicrosoft.com'
    const newUser = {
      "givenName": "Pavel",
      "surname": "Bansky",
      "emailAddresses": [
        {
          "address": userEmail,
          "name": "Pavel Bansky"
        }
      ],
      "businessPhones": [
        "+1 732 555 0102"
      ]
    }

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/${bookitServiceUserId}/contacts`;
      console.info('POST', URL, userEmail);
      this.tokenOperations.withToken()
          .then(token => {
            request.post(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .send(newUser)
                   .end((error, response) => {
                     if (error) {
                       reject(error);
                       return;
                     }
                     resolve(response.body);
                   });
          });
    });

  }

}
