import {Room, RoomList} from '../../model/Room';
import {MutableRoomService, RoomResponse, RoomService} from './RoomService';

import {RootLog as logger} from '../../utils/RootLogger';

export class MockRoomService implements RoomService, MutableRoomService {

  constructor(private roomLists: RoomList[]) {
    logger.info('MockRoomService: initializing with rooms', roomLists);
  }

  addRoomList(name: string): void {
  }

  addRoomToList(room: Room): void {
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

