import {UserService} from './UserService';

export class MockUserService implements UserService {
  getUsers(): Promise<any> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }
}

