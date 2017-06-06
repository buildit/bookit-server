import {RootLog as logger} from '../../utils/RootLogger';

import {GroupService} from './GroupService';

export class MockGroupService implements GroupService {
  constructor() {
    logger.info('MockGroupService: initializing');
  }


  getGroups(): Promise<Array<any>> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }


  getGroupMembers(name: string): Promise<any[]> {
    return Promise.reject('Method not implemented.');
  }

}

