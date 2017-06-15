import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {RoomService} from './RoomService';
import {Room, RoomList} from '../../model/Room';
import {GroupService, MSGroup} from '../groups/GroupService';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphRoomService extends MSGraphBase implements RoomService {
  constructor(graphTokenProvider: GraphTokenProvider, private _groupService: GroupService) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphRoomService');
  }


  getRoomLists(): Promise<RoomList[]> {
    return this.getRoomGroups()
               .then(roomGroups => {
                 const roomPromises = roomGroups.map(roomGroup => {
                   return this.getRooms(roomGroup.id)
                              .then(rooms => {
                                return {
                                  'id': roomGroup.id,
                                  'name': roomGroup.displayName,
                                  'rooms': rooms
                                };
                              });
                 });

                 return Promise.all(roomPromises);
               });
  }


  getRoomList(list: string): Promise<RoomList> {
    return this.getRoomGroups()
               .then(groups => {
                 // assume that the groups of rooms have '-rooms' in the name
                 const groupName = `${list}-rooms`;
                 const filteredGroups = groups.filter(group => group.displayName === groupName);
                 if (!filteredGroups.length) {
                   throw new Error('Unable to find room');
                 }

                 return filteredGroups[0];
               })
               .then(roomGroup => {
                 return this.getRooms(roomGroup.id)
                            .then(rooms => {
                              return {
                                'id': roomGroup.id,
                                'name': roomGroup.displayName,
                                'rooms': rooms
                              };
                            });
               });
  }


  getRoomByName(name: string): Promise<Room> {
    return this.getAllRooms().then(rooms => {
      const filtered = rooms.filter(room => room.name === name);
      if (filtered.length) {
        return filtered[0];
      }

      throw new Error(`Unable to find room with name ${name}`);
    });
  }


  getRoomByMail(mail: string): Promise<Room> {
    return this.getAllRooms().then(rooms => {
      const filtered = rooms.filter(room => room.mail === mail);
      if (filtered.length) {
        return filtered[0];
      }

      throw new Error(`Unable to find room with email ${mail}`);
    });
  }


  private getRoomGroups(): Promise<MSGroup[]> {
    return this._groupService.getGroups()
               .then(groups => {
                 // assume that the groups of rooms have '-rooms' in the name
                 logger.debug('Found groups', groups.map(group => group.displayName));

                 return groups.filter((group) => group.displayName.indexOf('-rooms'));
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


  private getRooms(roomGroupId: string): Promise<Room[]> {
    logger.debug(`getting rooms for room id '${roomGroupId}'`);
    return this._groupService
               .getGroupMembers(roomGroupId)
               .then(users => {
                 return users.map(user => {
                   return new Room(user.id, user.displayName, user.mail);
                 });
               });
  }

}

