import {BookitUser} from '../../model/BookitUser';
import {MSUser} from '../../model/MSUser';

export interface UserService {
  listExternalUsers(): Promise<Array<BookitUser>>;

  listInternalUsers(): Promise<Array<BookitUser>>;

  getDevices(userId: string): Promise<Array<any>>;

  postUser(user: any): Promise<MSUser>;
}
