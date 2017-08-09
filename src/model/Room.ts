import {Attendee} from './Attendee';

export class Room implements Attendee {
  id: string;
  name: string;
  mail: string;
  email: string;
  domain: string;

  constructor(id: string, name: string, mail: string) {
    this.id = id;
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
