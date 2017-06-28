import {RootLog as logger} from '../../utils/RootLogger';

import {GroupService, MSGroup} from './GroupService';
import {MSUser} from '../users/UserService';

export class MockGroupService implements GroupService {


  constructor(private _groups: MSGroup[], private _groupToUser: Map<string, MSUser[]>) {
    logger.info('Constructing MockGroupService');
    logger.info('  ', _groups.map(group => group.displayName));
    logger.info('  ', _groupToUser);
  }


  getGroups(): Promise<Array<MSGroup>> {
    return Promise.resolve(this._groups);
  }


  getGroupMembers(name: string): Promise<MSUser[]> {
    return Promise.resolve(this._groupToUser.get(name) || []);
  }


  addMemberToGroup(name: string): Promise<void> {
    return Promise.reject('Unimplemented: addMemberToGroup()');
  }


}

