import {UserService} from './UserService';

export class LocalUserService implements UserService {
  getUsers(): Promise<any> {
    return new Promise((resolve) => {
      throw 'Implement me';
    });
  }
}

