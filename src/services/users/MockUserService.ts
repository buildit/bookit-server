import {RootLog as logger} from '../../utils/RootLogger';

import {MSUser, UserService} from './UserService';
import {BookitUser} from '../../model/BookitUser';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MockUserService implements UserService {
  constructor(protected _domain: string) {
    logger.info('MockRoomService: initializing');
  }

  domain() {
    return this._domain;
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

  isInternalUser(email: string): boolean {
    return email.endsWith(`@${this.domain()}`);
  }


  validateUser(email: string): Promise<boolean> {
    return Promise.resolve(true);
  }


  isUserAnAdmin(email: string): boolean {
    return email === `bruce@${this.domain()}`;
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
