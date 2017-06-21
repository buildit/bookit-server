import {Room, RoomList} from '../../model/Room';
import {MutableRoomService, RoomService} from './RoomService';

import {RootLog as logger} from '../../utils/RootLogger';

export class MockRoomService implements RoomService, MutableRoomService {
  constructor(private _roomLists: RoomList[]) {
    logger.info('MockRoomService: initializing with lists', _roomLists);
    logger.info('MockRoomService: initializing with rooms', _roomLists.reduce((acc, list) => {
      acc.push.apply(acc, list.rooms);
      return acc;
    }, []));
  }


  addRoomList(name: string): void {
  }


  addRoomToList(room: Room): void {
  }


  getRoomList(list: string): Promise<RoomList> {
    return new Promise((resolve, reject) => {
      logger.debug('room lists', this._roomLists.map(rl => rl.name));
      const rl = this._roomLists.find(rl => rl.name === `${list}-rooms`);
      if (!rl) {
        throw new Error(`Unable to find room ${list}`);
      }

      resolve(rl);
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


  getRoomByName(name: string): Promise<Room> {
    return this.getAllRooms().then(rooms => {
      const filtered = rooms.filter(room => room.name === name);
      if (filtered.length) {
        return filtered[0];
      }

      throw new Error(`Unable to find room ${name}`);
    });
  }


  getRoomByMail(mail: string): Promise<Room> {
    return this.getAllRooms().then(rooms => {
      const filtered = rooms.filter(room => room.mail === mail);
      if (filtered.length) {
        return filtered[0];
      }

      throw new Error(`Unable to find room ${mail}`);
    });
  }


  private getAllRooms(): Promise<Room[]> {
    return this.getRoomLists().then(roomLists => {
      return roomLists.reduce((acc, roomList) => {
        acc.push.apply(acc, roomList.rooms);
        return acc;
      }, []);
    });
  }

}

