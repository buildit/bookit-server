import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';
import {MSGraphBase} from '../MSGraphBase';
import {MSUser, UserService} from './UserService';
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {BookitUser} from '../../model/BookitUser';
import {getServiceUser, getExternalTeam, getInternalTeam} from '../../config/identity';

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

  listInternalUsers(): Promise<Array<any>> {
    const bookitServiceUserId = getServiceUser('buildit');
    const internalTeam = getInternalTeam('buildit');

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/`;
      logger.info('GET', URL);
      this.tokenOperations.withToken()
          .then(token => {
            request.get(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(error);
                       return;
                     }
                     const users = response.body.value;
                     const mapUser = (user: any) => ({
                       email: user.userPrincipalName,
                       team: internalTeam,
                       roles: [''], // How to get this in the context of a "user"?
                       createdDateTime: '',
                       firstName: user.givenName,
                       lastName: user.surname,
                     })
                     const filterOutRooms = (user: any) => !(user.email.search('-room') > -1)
                     resolve(
                       users
                        .map(mapUser)
                        .filter(filterOutRooms)
                     );
                   });
          });
    });

  }

  listExternalUsers(): Promise<Array<any>> {
    const bookitServiceUserId = getServiceUser('buildit');
    const externalTeam = getExternalTeam('buildit');

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/${bookitServiceUserId}/contacts`;
      logger.info('GET', URL);
      this.tokenOperations.withToken()
          .then(token => {
            request.get(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(error);
                       return;
                     }
                     const users = response.body.value;
                     const mapUser = (user: any) => ({
                       email: user.emailAddresses[0].address,
                       team: externalTeam,
                       roles: user.categories,
                       createdDateTime: user.createdDateTime,
                       firstName: '',
                       lastName: '',
                     })
                     resolve(users.map(mapUser));
                   });
          });
    });

  }


  postUser(user: BookitUser): Promise<MSUser> {
    const bookitServiceUserId = getServiceUser('buildit');

    const userObjectThatMSLikesWAntsNEEDz = {
      givenName: user.email,
      emailAddresses: [{ address: user.email }],
      companyName: user.team,
    };

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/${bookitServiceUserId}/contacts`;
      logger.info('POST', URL, user.email);
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
