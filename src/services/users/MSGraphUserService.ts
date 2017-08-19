import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';
import {MSGraphBase} from '../MSGraphBase';
import {MSUser, UserService} from './UserService';
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {BookitUser} from '../../model/BookitUser';
import {getServiceUser, getExternalTeam, getInternalTeam} from '../../config/identity';
import {getToken} from '../meetings/MeetingsSupport';
import {Perspective} from '../../model/Meeting';

export class MSGraphUserService extends MSGraphBase implements UserService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphUserService');
  }


  listInternalUsers(): Promise<Array<any>> {
    logger.info('listInternalUsers', this.domain());
    const internalTeam = getInternalTeam(this.domain());

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
                     });
                     const filterOutRooms = (user: any) => !(user.email.search('-room') > -1);
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
    const bookitServiceUserId = getServiceUser(this.domain());
    const externalTeam = getExternalTeam(this.domain());

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
                     const contacts = response.body.value;
                     // logger.info('Users', users);
                     resolve(contacts.map((contact: any) => this.mapContactToUser(contact, externalTeam)));
                   });
          });
    });
  }

  private mapContactToUser(contact: any, team: string) {
    return {
      email: contact.emailAddresses[0].address,
      team: team,
      roles: contact.categories,
      createdDateTime: contact.createdDateTime,
      firstName: '',
      lastName: '',
    };
  }


  getUserDetails(user: string): Promise<MSUser> {
    logger.info(`Attempting to get user details ${user}`);

    return new Promise((resolve, reject) => {
      const URL = `https://graph.microsoft.com/v1.0/users/${user}`;
      logger.info('GET', URL);
      getToken(this.tokenOperations, this, Perspective.USER, user).then(token => {
        request.get(URL)
               .set('Authorization', `Bearer ${token}`)
               .end((error, response) => {
                 if (error) {
                   reject(error);
                   return;
                 }
                 const user = response.body;
                 logger.info('Found user', response.body);
                 const mapUser = (user: any) => ({
                   email: user.mail,
                   team: 'internal',
                   roles: [''], // How to get this in the context of a "user"?
                   createdDateTime: '',
                   firstName: user.givenName,
                   lastName: user.surname,
                 });

                 resolve(mapUser(user));
               });
      });
    });
  }


  isInternalUser(email: string): boolean {
    return email.endsWith(`@${this.domain()}`);
  }


  isUserAnAdmin(email: string): boolean {
    return email === `bruce@${this.domain()}`;
  }


  // TODO: Supply first condition via configuration
  validateUser(email: string): Promise<boolean> {
    if (this.isInternalUser(email)) {
      return Promise.resolve(true);
    }

    return this.listExternalUsers()
      .then((users: Array<any>) => users.filter(user => user.email === email).length > 0)
      .catch((err) => { console.log(err); return false; });
  };


  createUser(user: BookitUser): Promise<MSUser> {
    return this.postUser(user);
  }


  updateUser(user: BookitUser): Promise<MSUser> {
    // Get user from listExternalContacts(?) then filter + use id to udpate
    // user.id = resolvedExternalUser.id! BEEP BOOP!
    return this.postUser(user);
  }


  private postUser(user: BookitUser): Promise<MSUser> {
    const bookitServiceUserId = getServiceUser(this.domain());

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
