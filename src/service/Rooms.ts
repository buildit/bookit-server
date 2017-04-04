import {Room} from '../model/Room';

export class RoomResponse {
  readonly found: boolean;
  readonly rooms: Room[];
}

export interface Rooms {
  getRooms(list: string): RoomResponse;
}
