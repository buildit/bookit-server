import {Attendee} from './Attendee';

export class Room implements Attendee {
  name: string;
  mail: string;
  email: string;
  domain: string;

  constructor(id: string, name: string, mail: string) {
    this.name = name;
    this.mail = mail;
    this.email = mail;

    const parts = mail.split('@');
    this.domain = parts[1];

  }
}


export interface RoomList {
  id: string;
  name: string;
  rooms: Room[];
}
