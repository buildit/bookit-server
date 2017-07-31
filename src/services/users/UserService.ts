import {BookitUser} from '../../model/BookitUser';

export class MSUser {
  id: string;
  description: string;
  name: string;
  displayName: string;
  mail: string;
  email: string;

  constructor(id: string, displayName: string, description: string, mail: string) {
    this.id = id;
    this.name = displayName;
    this.displayName = displayName;
    this.description = description;
    this.mail = mail;
    this.email = mail;
  }
}

export interface UserService {
  listExternalUsers(): Promise<Array<BookitUser>>;

  listInternalUsers(): Promise<Array<BookitUser>>;

  validateExternalUser(email: string): Promise<boolean>;

  createUser(user: BookitUser): Promise<MSUser>;

  updateUser(user: BookitUser): Promise<MSUser>;
}
