export class Room {
  id: string;
  name: string;
  mail: string;
  email: string;
}


export interface RoomList {
  id: string;
  name: string;
  rooms: Room[];
}
