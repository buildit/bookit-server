import {RootLog as logger} from '../../utils/RootLogger';

import {Room, RoomList} from '../../model/Room';
import {RoomResponse, RoomService} from '../RoomService';


const COLORS: string[] = ['black', 'green', 'yellow'];

export class StubRoomService implements RoomService {
  constructor(private colors: string[] = COLORS) {
  }


  getRoomLists(): RoomList[] {
    throw new Error('Method not implemented.');
  }


  getRooms(list: string): RoomResponse {
    logger.info('Stub getting rooms');

    return {
      found: true,
      rooms: this.colors.map((color) => StubRoomService.createRoom(`${list}-${color}`))
    };
  }


  private static createRoom(name: string): Room {
    return {name: `${name} room`, email: `${name}-room@designit.com`};
  }
}
