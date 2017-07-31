import {RootLog as logger} from '../../utils/RootLogger';

import {GroupService, MSGroup} from './GroupService';
import {MSUser} from '../../model/MSUser';


/**
 * This class is meant primarily for testing purposes against a mock set of data.
 */
export class MockGroupService implements GroupService {

  constructor(private _groups: MSGroup[], private _groupToUser: Map<string, MSUser[]>) {
    logger.info('Constructing MockGroupService');
    logger.info('  ', _groups.map(group => group.displayName));
    logger.info('  ', _groupToUser);
  }


  getGroup(name: string): Promise<MSGroup> {
    return Promise.resolve(this._groups.find(group => group.displayName === name));
  }


  getGroups(): Promise<Array<MSGroup>> {
    return Promise.resolve(this._groups);
  }


  getGroupMembers(name: string): Promise<MSUser[]> {
    return Promise.resolve(this._groupToUser.get(name) || []);
  }


  addGroupMember(groupName: string, memberName: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
