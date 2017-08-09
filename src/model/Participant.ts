import {Attendee} from './Attendee';
let counter = 1;

export class Participant implements Attendee {
  id: string;
  name: string;
  mail: string;
  email: string;
  domain: string;

  constructor(email: string, name?: string) {
    this.id = `${counter++}`;
    this.mail = email;
    this.email = email;

    const parts = email.split('@');
    this.name = name ? name : parts[0];
    this.domain = parts[1];
  }
}
