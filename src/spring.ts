import * as moment from 'moment';
import {RootLog as logger} from './utils/RootLogger';

import {Runtime} from './config/runtime/configuration';
import {Room, RoomList} from './model/Room';
import {Participant} from './model/Participant';
import {generateMSRoomResource, generateMSUserResource} from './config/bootstrap/rooms';
import {Meeting} from './model/Meeting';
import {handleMeetingFetch} from './rest/meetings/meeting_functions';
import {MeetingsOps} from './services/meetings/MeetingsOps';
import {Credentials} from './model/Credentials';

logger.info('Spring: starting up');

const userService = Runtime.userService;
const groupService = Runtime.groupService;
const roomService = Runtime.roomService;
const meetingService = Runtime.meetingService;

const meetingOps = new MeetingsOps(meetingService);

function testGetUsers() {
  return userService.getUsers()
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


async function testMeetingCreate() {
  const owner = new Participant('bruce@designitcontoso.onmicrosoft.com');
  const room = generateMSRoomResource('Red', 'designitcontoso');
  const start = moment().startOf('hour').add(1, 'hour');
  const duration = moment.duration(1, 'hour');

  logger.info('start time', start);

  return meetingService.createMeeting(`Springboard meeting at ${start}`, start, duration, owner, room);
}


async function testMeetingDelete(meeting: Meeting) {
  const owner = new Participant('bruce@designitcontoso.onmicrosoft.com');
  // const room = generateMSRoomResource('Red', 'designitcontoso');
  // const start = moment().startOf('day').subtract(1, 'day');
  // const end = moment().startOf('day').add(1, 'day');

  logger.info('Meetings', meeting);
  return meetingService.deleteMeeting(owner, meeting.id);
}

// testMeetingCreate().then(meeting => {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       testMeetingDelete(meeting).then(resolve);
//     }, 7500);
//   });
// }).then(() => {
//   logger.info('Done');
// });
// testGetUsers();

const searchStart = '2017-06-27 03:55:00';
const searchEnd = '2017-07-01 09:35:00';

const start = moment(searchStart);
const end = moment(searchEnd);


handleMeetingFetch(roomService, meetingOps, undefined, 'nyc', start, end).then(roomMeetings => {
  logger.info('M', roomMeetings);
});
