import {Room, RoomList} from '../model/Room';

export class RoomResponse {
  readonly found: boolean;  // TODO: why is there a found flag on a room list?  not found should be null or undefined
  readonly rooms: Room[];
}

export interface RoomService {
  getRoomLists(): RoomList[];
  getRooms(list: string): RoomResponse;
}
