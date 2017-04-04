import {Room} from '../../model/Room';
import {RoomResponse, Rooms} from '../Rooms';


const COLORS: string[] = ['black', 'green', 'yellow'];

export class StubRooms implements Rooms {

  constructor(private colors: string[] = COLORS) {
  }

  getRooms(list: string): RoomResponse {
    return {
      found: true,
      rooms: this.colors.map((color) => this.createRoom(`${list}-${color}`))
    };
  }

  private createRoom(name: string): Room {
    return {name: `${name} room`, email: `${name}-room@designit.com`};
  }
}
