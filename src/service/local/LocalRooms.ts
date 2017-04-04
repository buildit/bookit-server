import {RoomList} from '../../model/ConfigRoot';
import {RoomResponse, Rooms} from '../Rooms';

export class LocalRooms implements Rooms {
  constructor(private roomLists: RoomList[]) {
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

