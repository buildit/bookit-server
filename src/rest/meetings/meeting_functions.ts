import * as moment from 'moment';
import {Request, Response} from 'express';

import {Participant} from '../../model/Participant';

import {RootLog as logger} from '../../utils/RootLogger';

import {checkParam, sendError} from '../rest_support';
import {Room} from '../../model/Room';
import {MeetingRequest} from './meeting_routes';
import {RoomService} from '../../services/rooms/RoomService';
import {MeetingsService} from '../../services/meetings/MeetingService';
import {
  createMeetingOperation, updateMeetingOperation, MeetingsOps, RoomMeetings
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
    createMeetingOperation(meetingService, event.title,
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
                              id: string,
                              owner: Participant) {
  const event = req.body as MeetingRequest;
  const startMoment = moment(event.start);
  const endMoment = moment(event.end);
  const roomId = req.params.roomEmail;

  logger.info('Want to update meeting:', event);
  const updateRoomMeeting = (room: Room) => {
    updateMeetingOperation(meetingService,
                           id,
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


export function handleMeetingFetch(roomService: RoomService,
                                   meetingOps: MeetingsOps,
                                   credentials: Credentials,
                                   listName: string,
                                   start: moment.Moment,
                                   end: moment.Moment): Promise<RoomMeetings[]> {
  return new Promise((resolve, reject) => {
    roomService.getRoomList(listName)
               .then(roomList => meetingOps.getRoomListMeetings(roomList.rooms, start, end))
               .then(roomMeetings => {
                 if (!credentials) {
                   logger.info('CREDS', credentials);
                   logger.info('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                   return resolve(roomMeetings);
                 }

                 const participant = new Participant(credentials.user);
                 meetingOps.getUserMeetings(participant, start, end)
                           .then(userMeetings => {
                             logger.info(`------------${participant.email}-----------`);
                             const merged = mergeMeetings(roomMeetings, userMeetings);
                             return resolve(merged);
                           });
               })
               .catch((err) => {
                 reject(err);
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
export function matchMeeting(meeting: Meeting, userMeetings: Meeting[]) {
  function meetingsMatch(some: Meeting, other: Meeting): boolean {
    const areStartsMismatching = () => !some.start.isSame(other.start);
    const areEndsMismatching = () => !some.end.isSame(other.end);
    const areOwnersMismatching = () => some.owner.email !== other.owner.email;

    const predicates = [areEndsMismatching, areStartsMismatching, areOwnersMismatching];
    const anyFailed = predicates.some(predicate => predicate());
    return !anyFailed;
  }

  return userMeetings.find(user => meetingsMatch(user, meeting));
}


function mergeMeetings(roomMeetings: RoomMeetings[], userMeetings: Meeting[]): RoomMeetings[] {
  function reconcileRoomCache(meeting: Meeting, roomCache: ListCache<Meeting>, roomEmail: string) {
    const toReturn = obscureMeetingIdentifier(meeting);

    const meetingsForRoom = roomCache.get(roomEmail);
    const userMeeting = matchMeeting(meeting, meetingsForRoom);
    if (!userMeeting) {
      return toReturn;
    }

    roomCache.remove(meeting);
    assignProperties(toReturn, userMeeting);
    return toReturn;
  }


  /*

   */
  const roomCache = new ListCache<Meeting>(new Map<string, Map<string, Meeting>>(), new RoomCachingStrategy());
  userMeetings.forEach(meeting => roomCache.put(meeting));
  logger.info('roomCache', roomCache);


  return roomMeetings.map(roomMeeting => {
    const roomId = roomMeeting.room.name;
    const originalMeetings = roomCache.get(roomId);
    logger.info(`meeting_functions::mergeMeetings ${roomId} has original meetings ${originalMeetings.length}`);

    const mergedMeetings = roomMeeting.meetings.map(meeting => reconcileRoomCache(meeting, roomCache, roomId));
    const leftOverMeetings = roomCache.get(roomId);
    logger.info(`meeting_functions::mergeMeetings ${roomId} has unmerged meetings ${leftOverMeetings.length}`);
    return {
      room: roomMeeting.room,
      meetings: mergedMeetings
    };
  });
}


export function handleMeetingDeletion(meetingService: MeetingsService, roomEmail: string, meetingId: string): Promise<void> {
  return meetingService.deleteUserMeeting(new Participant(roomEmail), meetingId);
}
