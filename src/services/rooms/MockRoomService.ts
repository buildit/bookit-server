import {Room, RoomList} from '../../model/Room';
import {MutableRoomService, RoomService} from './RoomService';

import {RootLog as logger} from '../../utils/RootLogger';

export class MockRoomService implements RoomService, MutableRoomService {

  constructor(private _roomLists: RoomList[]) {
    logger.info('MockRoomService: initializing with rooms', _roomLists);
  }

  addRoomList(name: string): void {
  }

  addRoomToList(room: Room): void {
  }


  getRoomList(list: string): Promise<RoomList> {
    return new Promise((resolve, reject) => {
      const rl = this._roomLists.find(rl => rl.name === list);
      if (rl) {
        return resolve(rl);
      }

      reject(`Unable to find room ${list}`);
    });
  }

  getRoomLists(): Promise<RoomList[]> {
    return Promise.resolve(this._roomLists);
  }


  getRooms(list: string): Promise<Room[]> {
    return new Promise((resolve, reject) => {
      const rl = this._roomLists.find(rl => rl.name === list);
      if (rl) {
        return resolve(rl.rooms);
      }

      reject(`Unable to find room ${list}`);
    });
  }
}

