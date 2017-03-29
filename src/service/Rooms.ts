import {Room} from '../model/Room';
export interface Rooms {
  getRooms(list: string): Room[];
}
