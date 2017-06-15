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
    logger.debug('getting groups');
    return this.client
               .api('/groups')
               // .select('id,displayName,mail')
               .get()
               .then(response => { return response.value; }) as Promise<MSGroup[]>;
  }


  getGroupMembers(id: string): Promise<MSUser[]> {
    logger.debug('getting group members', id);
    return this.client
               .api(`/groups/${id}/members`)
               .get()
               .then(response => { return response.value; }) as Promise<MSUser[]>;
  }

}

