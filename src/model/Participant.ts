import {Attendee} from './Attendee';
let counter = 1;

export class Participant implements Attendee {
  id: string;
  name: string;
  mail: string;
  email: string;

  constructor(email: string, name?: string) {
    this.id = `${counter++}`;
    this.mail = email;
    this.email = email;
    this.name = name ? name : email.split('@')[0];
  }
}
