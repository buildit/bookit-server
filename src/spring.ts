import {RootLog as logger} from './utils/RootLogger';

import {Runtime} from './config/runtime/configuration';
import {Room, RoomList} from './model/Room';

logger.info('Spring: starting up');

const userService = Runtime.userService;
const groupService = Runtime.groupService;
const roomService = Runtime.roomService;

function testGetUser() {
  userService.getUsers()
             .then(users => {
               logger.info('', users);
               return Promise.all(users.map(user => userService.getDevices(user.id)));
             })
             .then(response => {
               logger.info('', response);
             })
             .catch(error => {
               logger.error(error);
             });
}

function testGetDevices() {
  Runtime.deviceService.getDevices()
         .then(users => {
           logger.info('Device', users);
         })
         .catch(error => {
           logger.error(error);
         });
}

function testGetGroups() {
  groupService.getGroups()
              .then(groups => {
                logger.info('', groups);
                return groups;
              })
              .then(groups => {
                return Promise.all(groups.map(group => groupService.getGroupMembers(group.displayName)));
              })
              .then(members => {
                logger.info('Members', members);
              });
}

function testGetRooms() {
  roomService.getRoomLists()
             .then(roomLists => {
               return Promise.all(roomLists.map(roomList => roomService.getRoomList(roomList.id)));
             })
             .then((members: RoomList[]) => {
               logger.info('', members.map(member => member.rooms.map(room => room.mail)));
               // logger.info('', members);
             })
             .catch(error => {
               logger.error('', error);
             });
}

// testGetGroups();
testGetRooms();
