import {RoomList} from '../../model/Room';
import {RoomResponse, RoomService} from '../RoomService';

export class LocalRooms implements RoomService {
  constructor(private roomLists: RoomList[]) {
  }

  getRoomLists(): RoomList[] {
    return this.roomLists;
  }


  getRooms(list: string): RoomResponse {
    const rl = this.roomLists.find(rl => rl.name === list);
    if (rl) {
      return {
        found: true,
        rooms: rl.rooms
      };
    }
    return {
      found: false,
      rooms: []
    };
  }
}

