import {RoomService} from './RoomService';
import {RoomList} from '../../model/Room';

export class CacheRoomService implements RoomService {

  constructor(private roomService: RoomService) {
  }

  getRoomList(list: string): Promise<RoomList> {
    throw new Error('Method not implemented.');
  }

  getRoomLists(): Promise<RoomList[]> {
    return this.roomService.getRoomLists();
  }
}
