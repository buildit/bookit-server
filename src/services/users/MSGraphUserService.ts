import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';
import {MSGraphBase} from '../MSGraphBase';
import {UserService} from './UserService';
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {getServiceUser, getExternalTeam, getInternalTeam} from '../../config/identity';
import {mapMSUserToBookitUser, mapMSContactToBookitUser, filterOutRooms} from './user_functions';
import {MSUser} from '../../model/MSUser';
import {MSContact} from '../../model/MSContact';
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

  listInternalUsers(): Promise<Array<BookitUser>> {
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
                     resolve(
                       users
                        .map((user: MSUser) => mapMSUserToBookitUser(user, internalTeam))
                        .filter(filterOutRooms)
                     );
                   });
          });
    });

  }

  listExternalUsers(): Promise<Array<BookitUser>> {
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
                     resolve(users.map((user: MSContact) => mapMSContactToBookitUser(user, externalTeam)));
                   });
          });
    });

  }


  postUser(user: any): Promise<MSUser> {
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
