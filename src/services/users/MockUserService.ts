import {RootLog as logger} from '../../utils/RootLogger';

import {MSUser, UserService} from './UserService';

export class MockUserService implements UserService {
  constructor() {
    logger.info('MockRoomService: initializing');
  }


  getUsers(): Promise<Array<MSUser>> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }


  getDevices(userId: string): Promise<Array<any>> {
    return Promise.reject('Unimplemented');
  }
}

