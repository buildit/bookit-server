import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {RoomService} from './RoomService';
import {Room, RoomList} from '../../model/Room';
import {GroupService} from '../groups/GroupService';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphRoomService extends MSGraphBase implements RoomService {

  constructor(graphTokenProvider: GraphTokenProvider, private _groupService: GroupService) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphRoomService');
  }


  getRoomLists(): Promise<RoomList[]> {
    return this._groupService.getGroups()
               .then(groups => {
                 // assume that the groups of rooms have '-rooms' in the name
                 logger.info('Found groups', groups.map(group => group.displayName));

                 return groups.filter((group) => group.displayName.indexOf('-rooms'));
               })
               .then(rooms => {
                 return rooms.map(room => {
                   return {
                     'id': room.id,
                     'name': room.displayName,
                     'rooms': []
                   };
                 });
               });
  }


  getRoomList(list: string): Promise<RoomList> {
    return this._groupService.getGroups()
               .then(groups => {
                 // assume that the groups of rooms have '-rooms' in the name
                 const roomName = `${list}-rooms`;
                 const filteredRooms = groups.filter(group => group.displayName === roomName);
                 if (!filteredRooms.length) {
                   throw new Error('Unable to find room');
                 }

                 return filteredRooms[0];
               })
               .then(room => {
                 logger.info('Room', room);
                 return this.getRooms(room.id)
                            .then(rooms => {
                              return {
                                'id': room.id,
                                'name': room.displayName,
                                'rooms': rooms
                              };
                            });
               });
  }


  private getRooms(roomId: string): Promise<Room[]> {
    logger.info(`getting rooms for room id'${roomId}`);
    return this._groupService
               .getGroupMembers(roomId)
               .then(users => {
                 return users.map(user => {
                   return {
                     id: user.id,
                     name: user.displayName,
                     mail: user.mail,
                     email: user.mail
                   };
                 });
               });
  }

}

