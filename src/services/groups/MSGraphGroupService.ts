import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {GroupService, MSGroup} from './GroupService';
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {MSUser} from '../users/UserService';

export class MSGraphGroupService extends MSGraphBase implements GroupService {


  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphGroupService');
  }


  getGroups(): Promise<MSGroup[]> {
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.get('https://graph.microsoft.com/v1.0/groups')
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(new Error(error));
                     }

                     resolve(response.body.value as MSGroup[]);
                   });
          });
    });
  }


  getGroupMembers(id: string): Promise<MSUser[]> {
    logger.debug('getting group members', id);
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.get(`https://graph.microsoft.com/v1.0/groups/${id}/members`)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(new Error(error));
                     }

                     resolve(response.body.value as MSGroup[]);
                   });
          });
    });
  }


  addMemberToGroup(id: string, name: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.post(`https://graph.microsoft.com/v1.0/groups/${id}/members/${name}`)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(new Error(error));
                     }

                     resolve();
                   });
          });
    });
  }
}

