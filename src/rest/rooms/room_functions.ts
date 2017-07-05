import {RoomService} from '../../services/rooms/RoomService';
import {RoomList} from '../../model/Room';

export function listRooms(roomService: RoomService, listName: string): Promise<RoomList> {
  return roomService.getRoomList(listName);
}
