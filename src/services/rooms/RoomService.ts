import {Room, RoomList} from '../../model/Room';

// export class RoomResponse {
//   readonly rooms: Room[];
// }


export interface RoomService {
  getRoomList(list: string): Promise<RoomList>;
  getRoomLists(): Promise<RoomList[]>;
  getRoomByName(name: string): Promise<Room>;
  getRoomByMail(mail: string): Promise<Room>;
  // getRooms(list: string): Promise<Room[]>;
}


export interface MutableRoomService {
  addRoomList(name: string): void;
  addRoomToList(room: Room): void;
}
