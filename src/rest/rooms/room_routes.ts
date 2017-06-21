import {Express, Response, Request} from 'express';

import {RoomService} from '../../services/rooms/RoomService';
import {listRooms} from './room_functions';


export function configureRoomRoutes(app: Express,
                                       roomSvc: RoomService): Express {
  app.get('/rooms/:listName', (request: Request, response: Response) => {
    const listName = request.get('listName');
    listRooms(roomSvc, listName).then(roomList => {
      response.json(roomList.rooms);
    });

  });

  return app;
}

