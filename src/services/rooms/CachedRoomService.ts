

import {RoomResponse, RoomService} from './RoomService';
import {RoomList} from '../../model/Room';

export class CacheRoomService implements RoomService {

  constructor(private roomService: RoomService) {
  }


  getRoomLists(): RoomList[] {
    return this.roomService.getRoomLists();
  }

  getRooms(listName: string): RoomResponse {
    return this.roomService.getRooms(listName);
  }
}
