export class MSUser {
  id: string;
  description: string;
  name: string;
  displayName: string;
  mail: string;
  email: string;
  userPrincipalName?: string;
  givenName?: string;
  surname?: string;

  constructor(id: string, displayName: string, description: string, mail: string) {
    this.id = id;
    this.name = displayName;
    this.displayName = displayName;
    this.description = description;
    this.mail = mail;
    this.email = mail;
  }
}
