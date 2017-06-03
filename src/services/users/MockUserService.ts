import {RootLog as logger} from '../../utils/RootLogger';

import {UserService} from './UserService';

export class MockUserService implements UserService {
  constructor() {
    logger.info('MockRoomService: initializing');
  }


  getUsers(): Promise<any> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }
}

