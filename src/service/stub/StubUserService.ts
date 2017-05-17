import {UserService} from '../UserService';


export class StubUserService implements UserService {
  constructor() {
  }


  getUsers(): Promise<any> {
    return undefined;
  }
}
