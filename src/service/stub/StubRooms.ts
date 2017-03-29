import {Rooms} from '../Rooms';
import {Room} from '../../model/Room';


const COLORS: string[] = ['black', 'green', 'yellow'];

export class StubRooms implements Rooms {

  constructor(private colors: string[] = COLORS) {
  }

  getRooms(list: string): Room[] {
    return this.colors.map((color) => this.createRoom(`${list}-${color}`));
  }

  private createRoom(name: string): Room {
    return {name: `${name} room`, email: `${name}-room@designit.com`};
  }
}
