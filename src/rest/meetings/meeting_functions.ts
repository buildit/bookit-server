import * as moment from 'moment';
import {Request, Response} from 'express';

import {Participant} from '../../model/Participant';

import {RootLog as logger} from '../../utils/RootLogger';

import {checkParam, sendError} from '../rest_support';
import {Room} from '../../model/Room';
import {MeetingRequest} from './meeting_routes';
import {RoomService} from '../../services/rooms/RoomService';
import {MeetingsService} from '../../services/meetings/MeetingService';
import {createMeetingOperation, MeetingsOps, RoomMeetings} from '../../services/meetings/MeetingsOps';
import {extractAsMoment} from '../../utils/validation';
import {Credentials} from '../../model/Credentials';
import {Meeting} from '../../model/Meeting';


export function validateDate(req: Request, param: string) {
  const date = extractAsMoment(req, param);
  if (!date.isValid()) {
    const paramValue = req.query[param];
    throw new Error(`${param} is not a valid moment('${paramValue}').`);
  }

  return date;
}


export function validateEndDate(req: Request, param: string, startDate: moment.Moment) {
  const endDate = validateDate(req, param);
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

  if (checkParam(event.title && event.title.trim().length > 0, 'Title must be provided', res)
    && checkParam(startMoment.isValid(), 'Start date must be provided', res)
    && checkParam(endMoment.isValid(), 'End date must be provided', res)
    && checkParam(endMoment.isAfter(startMoment), 'End date must be after start date', res)) {

    roomService.getRoomByName(roomId)
               .then(createRoomMeeting)
               .catch(() => roomService.getRoomByMail(roomId))
               .then(createRoomMeeting)
               .catch(err => sendError(err, res));
  }
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

                 const part = new Participant(credentials.user);
                 meetingOps.getUserMeetings(part, start, end)
                           .then(userMeetings => {
                             logger.info(`------------${part.email}-----------`);
                             const merged = mergeMeetings(roomMeetings, userMeetings);
                             return resolve(merged);
                           });
               })
               .catch((err) => {
                 reject(err);
               });
  });
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
  logger.info('Merging meetings', userMeetings);

  return roomMeetings.map(roomNMeetings => {
    return {
      room: roomNMeetings.room,
      meetings: roomNMeetings.meetings.map(meeting => {
        const userMeeting = matchMeeting(meeting, userMeetings);
        logger.info('User meeting', meeting.id, userMeeting ? userMeeting.title : 'not found');
        return userMeeting ? userMeeting : meeting;
      })
    };
  });
}


export function handleMeetingDeletion(meetingService: MeetingsService, roomEmail: string, meetingId: string): Promise<void> {
  return meetingService.deleteMeeting(new Participant(roomEmail), meetingId);
}
