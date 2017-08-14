import {RootLog as logger} from '../../utils/RootLogger';

import {MSUser, UserService} from './UserService';
import {BookitUser} from '../../model/BookitUser';

export class MockUserService implements UserService {
  constructor() {
    logger.info('MockRoomService: initializing');
  }

  listExternalUsers(): Promise<Array<BookitUser>> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }

  listInternalUsers(): Promise<Array<BookitUser>> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }

  validateUser(email: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  createUser(user: BookitUser): Promise<any> {
    return Promise.reject('Unimplemented: MockUserService:createUser');
  }

  updateUser(user: BookitUser): Promise<any> {
    return Promise.reject('Unimplemented: MockUserService:updateUser');
  }

  getUserDetails(user: string): Promise<MSUser> {
    return Promise.reject('Unimplemented: MockUserService:getUserDetails');
  }


}
