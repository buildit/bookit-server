import {Room, RoomList} from '../../model/Room';
import {MutableRoomService, RoomResponse, RoomService} from './RoomService';


export class MockRoomService implements RoomService, MutableRoomService {

  constructor(private roomLists: RoomList[]) {
  }

  addRoomList(name: string): void {
  }

  addRoomToList(room: Room): void {
  }

  getRoomLists(): RoomList[] {
    return this.roomLists;
  }


  getRooms(list: string): RoomResponse {
    // logger.info('MockRoomService getting rooms');
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

