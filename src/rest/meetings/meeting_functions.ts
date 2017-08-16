import * as moment from 'moment';
import {Request, Response} from 'express';

import {Participant} from '../../model/Participant';

import {RootLog as logger} from '../../utils/RootLogger';

import {sendError} from '../rest_support';
import {Room, RoomList} from '../../model/Room';
import {MeetingRequest} from './meeting_routes';
import {RoomService} from '../../services/rooms/RoomService';
import {MeetingsService} from '../../services/meetings/MeetingService';
import {
  createMeetingOperation, updateMeetingOperation, RoomMeetings
} from '../../services/meetings/MeetingsOps';
import {Credentials} from '../../model/Credentials';
import {Meeting} from '../../model/Meeting';
import {Moment} from 'moment';
import {RoomCachingStrategy} from '../../services/meetings/RoomCachingStrategy';
import {ListCache} from '../../utils/cache/caches';




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


export function meetingsNoEmpty(meetings: Meeting[]) {
  return meetings.length > 0;
}

export function createMeeting(req: Request,
                              res: Response,
                              roomService: RoomService,
                              meetingService: MeetingsService,
                              owner: Participant) {
  const event = req.body as MeetingRequest;
  const startMoment = moment(event.start);
  const endMoment = moment(event.end);
  const roomId = req.params.roomEmail;

  logger.info('Want to create meeting:', event);
  const createRoomMeeting = (room: Room) => {
    createMeetingOperation(meetingService,
                           event.title,
                           startMoment,
                           moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes'),
                           owner,
                           room)
      .then(meeting => res.json(meeting))
      .catch(err => sendError(err, res));
  };

  roomService.getRoomByName(roomId)
             .then(createRoomMeeting)
             .catch(() => roomService.getRoomByMail(roomId))
             .then(createRoomMeeting)
             .catch(err => sendError(err, res));
}


export function updateMeeting(req: Request,
                              res: Response,
                              roomService: RoomService,
                              meetingService: MeetingsService,
                              userMeetingId: string,
                              owner: Participant) {
  const event = req.body as MeetingRequest;
  const startMoment = moment(event.start);
  const endMoment = moment(event.end);
  const roomId = req.params.roomEmail;

  logger.info('Want to update meeting:', event);
  const updateRoomMeeting = (room: Room) => {
    updateMeetingOperation(meetingService,
                           userMeetingId,
                           event.title,
                           startMoment,
                           moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes'),
                           owner,
                           room)
      .then(meeting => res.json(meeting))
      .catch(err => sendError(err, res));
  };

  roomService.getRoomByName(roomId)
             .then(updateRoomMeeting)
             .catch(() => roomService.getRoomByMail(roomId))
             .then(updateRoomMeeting)
             .catch(err => sendError(err, res));
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

  const mergedMeetings = roomList.rooms.map(room => getRoomAndMergeUserMeetings(meetingService,
                                                                                room,
                                                                                start,
                                                                                end,
                                                                                userMeetings));
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


export function handleRoomMeetingFetch(meetingService: MeetingsService,
                                       room: Room,
                                       owner: Participant,
                                       start: Moment,
                                       end: Moment): Promise<RoomMeetings> {
  return meetingService.getUserMeetings(owner, start, end)
                       .then(userMeetings => {
                         return getRoomAndMergeUserMeetings(meetingService,
                                                            room,
                                                            start,
                                                            end,
                                                            userMeetings);
                       });
}

export function handleMeetingFetch(roomService: RoomService,
                                   meetingService: MeetingsService,
                                   credentials: Credentials,
                                   listName: string,
                                   start: Moment,
                                   end: Moment): Promise<RoomMeetings[]> {
  return roomService.getRoomList(listName)
                    .then(roomList => {
                      const promisedMeetings = getUserMeetings(meetingService, credentials, start, end);
                      return promisedMeetings.then(userMeetings => {
                        return getMergedRoomListUserMeetings(meetingService, roomList, start, end, userMeetings);
                      });
                    });
}


export function obscureMeetingDetails(meeting: Meeting) {
  const copy = Object.assign({}, meeting);
  copy.title = meeting.owner.name;

  return copy;
}


export function obscureMeetingIdentifier(meeting: Meeting) {
  const toReturn = Object.assign({}, meeting);
  toReturn.id = undefined;

  return toReturn;
}


export function assignProperties(roomMeeting: Meeting, userMeeting: Meeting) {
  roomMeeting.title = userMeeting.title;
  roomMeeting.id = userMeeting.id;

  logger.info(`meeting_functions::assignProperties() ${roomMeeting.title} - ${userMeeting.title}`);
  return roomMeeting;
}


/*
Can't match by meeting id when using different user perspectives
Don't match by location since bookings by BookIt and Outlook are different
 */
export function matchMeeting(meeting: Meeting, otherMeetings: Meeting[]): Meeting {
  function meetingsMatch(some: Meeting, other: Meeting): boolean {
    const areStartsMismatching = () => !some.start.isSame(other.start);
    const areEndsMismatching = () => !some.end.isSame(other.end);
    const areOwnersMismatching = () => some.owner.email !== other.owner.email;

    const predicates = [areEndsMismatching, areStartsMismatching, areOwnersMismatching];
    const anyFailed = predicates.some(predicate => predicate());
    return !anyFailed;
  }

  return otherMeetings.find(user => meetingsMatch(user, meeting));
}


function reconcileRoomCache(meeting: Meeting, roomCache: ListCache<Meeting>, roomId: string) {
  const toReturn = obscureMeetingIdentifier(meeting);

  const meetingsForRoom = roomCache.get(roomId);
  const userMeeting = matchMeeting(meeting, meetingsForRoom);
  if (!userMeeting) {
    logger.info(`Unable to match meeting ${roomId}, ${meeting.id}`);
    return toReturn;
  }

  // logger.info('Meetings for room', meetingsForRoom);
  roomCache.remove(userMeeting);
  assignProperties(toReturn, userMeeting);

  const meetingsForRoomAfter = roomCache.get(roomId);
  // logger.info('Meetings for room after', meetingsForRoomAfter);
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
  const roomCache = cacheMeetingsByRoom(userMeetings);
  // console.log('RoomCache', roomCache);

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


function mergeMeetings(roomMeetings: RoomMeetings[], userMeetings: Meeting[]): RoomMeetings[] {
  const roomCache = new ListCache<Meeting>(new Map<string, Map<string, Meeting>>(), new RoomCachingStrategy());
  userMeetings.forEach(meeting => roomCache.put(meeting));

  return roomMeetings.map(roomMeeting => {
    const roomId = roomMeeting.room.name;
    const originalMeetings = roomCache.get(roomId);
    logger.info(`meeting_functions::mergeMeetings ${roomId} has original meetings ${originalMeetings.length}`);

    const mergedMeetings = mergeMeetingsForRoom(roomMeeting.room, roomMeeting.meetings, userMeetings);
    return {
      room: roomMeeting.room,
      meetings: mergedMeetings
    };
  });
}


export function handleMeetingDeletion(meetingService: MeetingsService, roomEmail: string, meetingId: string): Promise<void> {
  return meetingService.deleteUserMeeting(new Participant(roomEmail), meetingId);
}
