export class Room {
  id: string;
  name: string;
  mail: string;
  email: string;

  constructor(id: string, name: string, mail: string) {
    this.id = id;
    this.name = name;
    this.mail = mail;
    this.email = mail;
  }
}


export interface RoomList {
  id: string;
  name: string;
  rooms: Room[];
}
