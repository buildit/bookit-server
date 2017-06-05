import {Room, RoomList} from '../../model/Room';

export class RoomResponse {
  readonly found: boolean;
  readonly rooms: Room[];
}


export interface RoomService {
  getRoomLists(): RoomList[];
  getRooms(list: string): RoomResponse;
}


export interface MutableRoomService {
  addRoomList(name: string): void;
  addRoomToList(room: Room): void;
}
