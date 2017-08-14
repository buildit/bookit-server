import {BookitUser} from '../../model/BookitUser';

export class MSUser {
  id: string;
  description: string;
  name: string;
  displayName: string;
  mail: string;
  email: string;
  domain: string;

  constructor(id: string, displayName: string, description: string, mail: string) {
    this.id = id;
    this.name = displayName;
    this.displayName = displayName;
    this.description = description;
    this.mail = mail;
    this.email = mail;

    console.info('MSUser', mail);
    const parts = mail.split('@');
    this.domain = parts[1];
  }
}

export interface UserService {
  listExternalUsers(): Promise<Array<BookitUser>>;

  listInternalUsers(): Promise<Array<BookitUser>>;

  validateUser(email: string): Promise<boolean>;

  createUser(user: BookitUser): Promise<MSUser>;

  updateUser(user: BookitUser): Promise<MSUser>;

  getUserDetails(user: string): Promise<MSUser>;
}
