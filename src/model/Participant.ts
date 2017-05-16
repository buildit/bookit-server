

export class Participant {
  name?: string;
  email: string;

  constructor(email: string, name?: string) {
    this.email = email;
    this.name = name ? name : email.split('@')[0];
  }
}
