import {RoomService} from './RoomService';
import {Room, RoomList} from '../../model/Room';

export class CachedRoomService implements RoomService {
  constructor(private roomService: RoomService) {
  }

  getRoomList(list: string): Promise<RoomList> {
    return Promise.reject('Method not implemented.');
  }

  getRoomLists(): Promise<RoomList[]> {
    return this.roomService.getRoomLists();
  }


  getRoomByName(name: string): Promise<Room> {
    return Promise.reject('Method not implemented.');
  }

  getRoomByMail(mail: string): Promise<Room> {
    return Promise.reject('Method not implemented.');
  }

}
