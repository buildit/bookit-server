import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';
import {MSGraphBase} from '../MSGraphBase';
import {MSUser, UserService} from './UserService';
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {BookitUser} from '../../model/BookitUser';

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
    const bookitServiceUserId = 'roodmin@builditcontoso.onmicrosoft.com';

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
            reject(error);
          });
    });
  }

  postUser(user: BookitUser): Promise<MSUser> {
    const bookitServiceUserId = 'roodmin@builditcontoso.onmicrosoft.com';

    const userObjectThatMSLikesWAntsNEEDz = {
      givenName: user.email,
      emailAddresses: [{ address: user.email }],
      companyName: 'Wipro', // Assuming all external users work for Wipro
    };

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/${bookitServiceUserId}/contacts`;
      console.info('POST', URL, user.email);
      this.tokenOperations.withToken()
          .then(token => {
            request.post(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .send(userObjectThatMSLikesWAntsNEEDz)
                   .end((error, response) => {
                     if (error) {
                       reject(error);
                       return;
                     }
                     const user = {
                       name: response.body.givenName,
                       email: response.body.emailAddresses[0].address,
                     };
                     resolve(user);
                   });
          });
    });

  }

}
