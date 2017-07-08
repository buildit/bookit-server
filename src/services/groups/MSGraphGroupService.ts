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
    const URL = 'https://graph.microsoft.com/v1.0/groups';
    logger.info('MSGraphGroupService::getGroups() - ', URL);
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.get(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       logger.error(error);
                       return reject(new Error(error));
                     }

                     // logger.info('Response', response);
                     const groups = response.body.value;
                     resolve(groups);
                   });
          });
    });

  }


  getGroupMembers(id: string): Promise<MSUser[]> {
    const URL = `https://graph.microsoft.com/v1.0/groups/${id}/members`;
    logger.info('MSGraphGroupService::getGroupMembers() - ', URL);
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.get(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       logger.error(error);
                       return reject(new Error(error));
                     }

                     // logger.info('Response', response.body.value);
                     const groups = response.body.value;
                     resolve(groups);
                   });
          });
    });
  }

}

