import * as moment from 'moment';
import {Request, Response} from 'express';

import {Participant} from '../../model/Participant';

import {RootLog as logger} from '../../utils/RootLogger';

import {sendError, sendPreconditionFailed, sendUnauthorized} from '../rest_support';
import {Room, RoomList} from '../../model/Room';
import {MeetingRequest} from './meeting_routes';
import {RoomService} from '../../services/rooms/RoomService';
import {MeetingsService} from '../../services/meetings/MeetingService';
import {
  createMeetingOperation, RoomMeetings, checkUserIsAdmin, checkMeetingTimeIsAvailable, checkTimeIsAvailable
} from '../../services/meetings/MeetingsOps';
import {Credentials} from '../../model/Credentials';
import {Meeting} from '../../model/Meeting';
import {Duration, Moment} from 'moment';
import {RoomCachingStrategy} from '../../services/meetings/RoomCachingStrategy';
import {ListCache} from '../../utils/cache/caches';
import {v4 as uuid} from 'uuid';
import {UserService} from '../../services/users/UserService';
import has = Reflect.has;


export function validateEndDate(startDate: Moment, endDate: Moment) {
  if (startDate.isAfter(endDate)) {
    throw new Error('End date must be after start date.');
  }

  return endDate;
}


export function validateDateRange(startDate: moment.Moment, endDate: moment.Moment) {
  const range = Math.abs(endDate.diff(startDate, 'months'));
  if (range > 12) {
    throw new Error('No more than a year\'s worth of meetings can be fetched.');
  }
}


export function validateTitle(title: string) {
  if (!title || title.trim().length === 0) {
    throw new Error('Title must be provided');
  }
}


export function validateTimes(start: Moment, end: Moment) {
  validateEndDate(start, end);
  validateDateRange(start, end);

  return {start, end};
}


function tryToGetRoom(roomService: RoomService, roomId: string): Promise<Room> {
  return roomService.getRoomByName(roomId)
                    .catch(() => roomService.getRoomByMail(roomId));
}


export function createMeeting(req: Request,
                              res: Response,
                              roomService: RoomService,
                              meetingService: MeetingsService,
                              owner: Participant) {
  const event = req.body as MeetingRequest;
  const subj = event.title;
  const startMoment = moment(event.start);
  const endMoment = moment(event.end);
  const duration = moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes');
  const roomId = req.params.roomEmail;

  tryToGetRoom(roomService, roomId)
             .then(room => checkTimeIsAvailable(meetingService, room, moment.utc(startMoment), duration).then(() => room))
             .catch(hasConflict => {
               sendPreconditionFailed(res, hasConflict);
               return null;
             })
             /*
             This is so gross!
              */
             .then(room => {
               if (room) {
                 logger.info('Want to create user meeting', owner);
                 return meetingService.createUserMeeting(subj, startMoment, duration, owner, room);
               }
             })
             .then(meeting => res.json(meeting))
             .catch(err => {
               logger.error('createMeeting', err);
               sendError(res, err);
             });
}


export function updateMeeting(req: Request,
                              res: Response,
                              roomService: RoomService,
                              userService: UserService,
                              meetingService: MeetingsService,
                              userMeetingId: string,
                              updater: Participant) {
  const event = req.body as MeetingRequest;
  const subj = event.title;
  const startMoment = moment(event.start);
  const endMoment = moment(event.end);
  const duration = moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes');
  const roomId = req.params.roomEmail;

  logger.info('Want to update meeting:', event);

  const room = tryToGetRoom(roomService, roomId)

  /*
    For meeting updates, we need to check against the room to see if we would conflict with
    another users meeting.
   */
                          .then(room => {
                            return handleRoomMeetingFetch(meetingService, userService, room, updater, startMoment, endMoment)
                              .then(roomMeetings => {
                                checkMeetingTimeIsAvailable(roomMeetings.meetings, userMeetingId, startMoment, duration);
                                return room;
                              })
                              .catch(err => {
                                try {
                                  if (checkUserIsAdmin(userService, updater)) {
                                    sendPreconditionFailed(res, err);
                                  }
                                }
                                catch (error) {
                                  sendUnauthorized(res, 'You are not the owner of this meeting');
                                }

                                return null;
                              });
                          });

  /*
  If we don't get a room then we've errored out on conflicts or permissions
   */
  room.then(room => {
    if (!room) {
      return;
    }
    /*
      If we find the meeting for the current user, then it's the owner.  If not the owner, check
      that the updater is an admin.
     */
    return meetingService.getUserMeeting(updater, userMeetingId)
                         .catch(() => checkUserIsAdmin(userService, updater))
                         .catch((err) => sendUnauthorized(res, err))
                         .then(() => room)
                         .then(room => meetingService.updateUserMeeting(userMeetingId, subj,
                                                                        startMoment, duration, updater, room))
                         .then(meeting => res.json(meeting))
                         .catch(err => sendError(res, err));
  });
}


export function deleteMeeting(req: Request,
                              res: Response,
                              userService: UserService,
                              meetingService: MeetingsService,
                              roomEmail: string,
                              meetingId: string,
                              updater: Participant): Promise<any> {

  return meetingService.getUserMeeting(updater, meetingId)
                       .catch(() => checkUserIsAdmin(userService, updater))
                       .catch((err) => sendUnauthorized(res, err))
                       .then(() => meetingService.deleteUserMeeting(new Participant(roomEmail), meetingId))
                       .catch((err) => sendError(res, err));
}



function getRoomAndMergeUserMeetings(meetingService: MeetingsService,
                                     room: Room,
                                     start: moment.Moment,
                                     end: moment.Moment,
                                     userMeetings: Meeting[]): Promise<RoomMeetings> {
  return meetingService.getMeetings(room, start, end)
                       .then(roomMeetings => mergeMeetingsForRoom(room, roomMeetings, userMeetings))
                       .then(mergedMeetings => {
                         return {
                           room: room,
                           meetings: mergedMeetings
                         };
                       });
}


function getMergedRoomListUserMeetings(meetingService: MeetingsService,
                                       roomList: RoomList,
                                       start: moment.Moment,
                                       end: moment.Moment,
                                       userMeetings: Meeting[]): Promise<RoomMeetings[]> {

  const mergeRoom = (room: Room) => getRoomAndMergeUserMeetings(meetingService,
                                                                room,
                                                                start,
                                                                end,
                                                                userMeetings);

  const mergedMeetings = roomList.rooms.map(room => mergeRoom(room));
  return Promise.all(mergedMeetings);
}


function getUserMeetings(meetingService: MeetingsService,
                         credentials: Credentials,
                         start: Moment,
                         end: Moment): Promise<Meeting[]> {
  if (!credentials) {
    return Promise.resolve([]);
  }

  const owner = new Participant(credentials.user);
  return meetingService.getUserMeetings(owner, start, end);
}


async function handleRoomMeetingFetch(meetingService: MeetingsService,
                                      userService: UserService,
                                      room: Room,
                                      user: Participant,
                                      start: Moment,
                                      end: Moment): Promise<RoomMeetings> {
  async function getAdminRoomMeetings() {
    const getUserMeetings = (owner: Participant) => meetingService.getUserMeetings(owner, start, end);

    const roomMeetings = await meetingService.getMeetings(room, start, end);
    const participants = getUniqueOwners(roomMeetings);
    const flattenedUserMeetings = await getAndFlattenAllUserMeetings(participants, getUserMeetings);
    const meetings = mergeMeetingsForRoom(room, roomMeetings, flattenedUserMeetings);
    return {room, meetings};
  }

  async function getPlainRoomMeetings() {
    const userMeetings = await meetingService.getUserMeetings(user, start, end);
    return getRoomAndMergeUserMeetings(meetingService, room, start, end, userMeetings);
  }

  const isAdminUser = userService.isUserAnAdmin(user.email);
  return isAdminUser ? getAdminRoomMeetings() : getPlainRoomMeetings();
}


export function handleMeetingFetch(roomService: RoomService,
                                   meetingService: MeetingsService,
                                   userService: UserService,
                                   credentials: Credentials,
                                   listName: string,
                                   start: Moment,
                                   end: Moment): Promise<RoomMeetings[]> {
  const promisedRoomList = roomService.getRoomList(listName);
  const isAdminUser = credentials && credentials.user && userService.isUserAnAdmin(credentials.user);
  return isAdminUser
    ? promisedRoomList.then(roomList => handleAdminMeetingFetch(roomList, meetingService, credentials, start, end))
    : promisedRoomList.then(roomList => handleUserMeetingFetch(roomList, meetingService, credentials, start, end));
}


export function handleUserMeetingFetch(roomList: RoomList,
                                       meetingService: MeetingsService,
                                       credentials: Credentials,
                                       start: Moment,
                                       end: Moment) {
  const promisedMeetings = getUserMeetings(meetingService, credentials, start, end);
  return promisedMeetings.then(userMeetings => {
    return getMergedRoomListUserMeetings(meetingService, roomList, start, end, userMeetings);
  });

}


function getUniqueOwners(meetings: Meeting[]): Participant[] {
  const uniqueParticipants = {
    emails: new Set<string>(),
    participants: new Set<Participant>()
  };

  meetings.reduce((unique, meeting) => {
    const owner = meeting.owner;
    if (unique.emails.has(owner.email)) {
      return unique;
    }

    unique.emails.add(owner.email);
    unique.participants.add(owner);
    return unique;
  }, uniqueParticipants);

  return Array.from(uniqueParticipants.participants);
}


function flattenRoomListRooms(roomLists: RoomList[]): Room[] {
    return roomLists.reduce((acc, roomList) => {
      acc.push.apply(acc, roomList.rooms);
      return acc;
    }, []);
}


function flattenRoomListMeetings(roomLists: RoomMeetings[]): Meeting[] {
  return roomLists.reduce((acc, roomList) => {
    acc.push.apply(acc, roomList.meetings);
    return acc;
  }, []);
}


async function getAndFlattenAllUserMeetings(participants: Participant[],
                                            getUserMeetings: (owner: Participant) => Promise<Meeting[]>): Promise<Meeting[]> {
  const allUserMeetings = await Promise.all(Array.from(participants).map(getUserMeetings));
  return allUserMeetings.reduce((flattenedMeetings, userMeetings) => {
    flattenedMeetings.push.apply(flattenedMeetings, userMeetings);
    return flattenedMeetings;
  }, new Array<Meeting>());
}


export async function handleAdminMeetingFetch(roomList: RoomList,
                                              meetingService: MeetingsService,
                                              credentials: Credentials,
                                              start: Moment,
                                              end: Moment): Promise<RoomMeetings[]> {

  logger.info('Handling meeting fetch for admins');
  // room meetings convenience function
  const getRoomMeetings = (room: Room) => meetingService.getMeetings(room, start, end)
                                                        .then(meetings => {
                                                          return {room: room, meetings: meetings};
                                                        });

  // user meetings convenience function
  const getUserMeetings = (owner: Participant) => meetingService.getUserMeetings(owner, start, end);

  /*
  Get all room meetings first
   */
  const allRoomMeetings = await Promise.all(roomList.rooms.map(getRoomMeetings));
  const flattenedRoomMeetings = flattenRoomListMeetings(allRoomMeetings);
  /*
  Figure out the various owner so we can...
   */
  const participants = getUniqueOwners(flattenedRoomMeetings);
  /*
  ..query their calendars for meetings from their perspectives.
   */
  const flattenedUserMeetings = await getAndFlattenAllUserMeetings(participants, getUserMeetings);
  /*
  Then merge the room meetings against the user meetings
   */
  return allRoomMeetings.map(roomMeetings => {
    return {
      room: roomMeetings.room,
      meetings: mergeMeetingsForRoom(roomMeetings.room, roomMeetings.meetings, flattenedUserMeetings)
    };
  });

}


export function obscureMeetingDetails(meeting: Meeting) {
  const copy = Object.assign({}, meeting);
  copy.title = meeting.owner.name;

  return copy;
}


export function copyAndObscureMeetingIdentifier(meeting: Meeting) {
  const toReturn = Object.assign({}, meeting);
  toReturn.id = 'obscured' + uuid();

  return toReturn;
}


export function assignProperties(roomMeeting: Meeting, userMeeting: Meeting) {
  roomMeeting.title = userMeeting.title;
  roomMeeting.id = userMeeting.id;

  logger.info(`meeting_functions::assignProperties() ${roomMeeting.title} - ${userMeeting.title}`);
  return roomMeeting;
}


const DATE_TIME_FORMAT = 'YYYYMMDD h:mm:ss';

function formatMoment(moment: Moment) {
  return moment.format(DATE_TIME_FORMAT);
}

/*
Can't match by meeting id when using different user perspectives
 */
export function matchMeeting(meeting: Meeting, otherMeetings: Meeting[]): Meeting {

  const otherStart = formatMoment(meeting.start);
  const otherEnd = formatMoment(meeting.end);
  const otherEmail = meeting.owner.email;
  const otherLocation = meeting.location.displayName;

  function meetingsMatch(some: Meeting): boolean {
    const areStartsMismatching = () => formatMoment(some.start) !== otherStart;
    const areEndsMismatching = () => formatMoment(some.end) !== otherEnd;
    const areOwnersMismatching = () => some.owner.email !== otherEmail;
    const areLocationsMismatching = () => some.location.displayName !== otherLocation;

    const predicates = [areEndsMismatching, areStartsMismatching, areOwnersMismatching, areLocationsMismatching];
    const anyFailed = predicates.some(predicate => {
      const res = predicate();
      if (!res) {
        logger.trace(`Mismatched on ${predicate.name}`);
      }

      return res;
    });

    const matched = !anyFailed;
    if (matched) {
      logger.info(`Matched ${meeting.id} to ${some.id}`);
    }

    return matched;
  }

  return otherMeetings.find(meetingsMatch);
}


function reconcileRoomCache(meeting: Meeting, roomCache: ListCache<Meeting>, roomId: string) {
  const toReturn = copyAndObscureMeetingIdentifier(meeting);

  const meetingsForRoom = roomCache.get(roomId);
  const userMeeting = matchMeeting(meeting, meetingsForRoom);
  if (!userMeeting) {
    logger.debug(`Unable to match meeting ${roomId}, ${meeting.id}`);
    return toReturn;
  } else {
    logger.debug(`Matched ${meeting.id} to ${userMeeting.id}`);
  }

  roomCache.remove(userMeeting);
  assignProperties(toReturn, userMeeting);

  return toReturn;
}


function cacheMeetingsByRoom(meetings: Meeting[]): ListCache<Meeting> {
  const roomCache = new ListCache<Meeting>(new Map<string, Map<string, Meeting>>(), new RoomCachingStrategy());
  meetings.forEach(meeting => roomCache.put(meeting));

  return roomCache;
}


function mergeMeetingsForRoom(room: Room, roomMeetings: Meeting[], userMeetings: Meeting[]): Meeting[] {
  function matchLeftOver(roomName: string, owner: Participant, roomMeeting: Meeting) {
    return (roomMeeting.owner.email === owner.email && roomMeeting.location.displayName === roomName);
  }
  // logger.info('User Meetings', userMeetings.length);
  const roomCache = cacheMeetingsByRoom(userMeetings);
  // logger.info('RoomCache', roomCache);

  const roomId = room.name;
  const mergedMeetings = roomMeetings.map(meeting => reconcileRoomCache(meeting, roomCache, roomId));
  const leftOverMeetings = roomCache.get(roomId);
  if (leftOverMeetings.length > 0) {
    const owner = userMeetings[0].owner;
    const applicable = leftOverMeetings.filter(meeting => matchLeftOver(room.name, owner, meeting));

    const data = leftOverMeetings.map(m => { return `'id': '${m.id}', 'title': '${m.title}', 'loc': '${m.location.displayName}', 'start': '${m.start.format()}', 'end': '${m.end.format()}'`; });
    logger.info(`meeting_functions::mergeMeetings ${roomId} has unmerged meetings ${data}`);
    mergedMeetings.push.apply(mergedMeetings, applicable);
    // logger.info(`meeting_functions::mergeMeetings ${roomId} has unmerged meetings`, leftOverMeetings);
  }

  return mergedMeetings;
}
