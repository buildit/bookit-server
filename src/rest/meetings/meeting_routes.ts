import * as moment from 'moment';
import {Express, Request, Response, Router} from 'express';
import {start} from 'repl';

import {Participant} from '../../model/Participant';

import {MeetingsService} from '../../services/meetings/MeetingService';
import {MeetingsOps, RoomMeetings} from '../../services/meetings/MeetingsOps';
import {RoomService} from '../../services/rooms/RoomService';
import {RootLog as logger} from '../../utils/RootLogger';
import {extractAsMoment} from '../../utils/validation';

import {checkParam, sendError, sendGatewayError, sendNotFound, sendValidation} from '../rest_support';
import {credentialedEndpoint, protectedEndpoint} from '../filters';
import {TokenInfo} from '../auth_routes';
import {createMeeting} from './meeting_functions';
import {Credentials} from '../../model/Credentials';
import {Meeting} from '../../model/Meeting';


export interface MeetingRequest {
  readonly title: string;
  readonly start: string;
  readonly end: string;
}


function validateDate(req: Request, param: string) {
  const date = extractAsMoment(req, param);
  if (!date.isValid()) {
    throw new Error(`${param} is not a valid moment.`);
  }

  return date;
}


function validateEndDate(req: Request, param: string, startDate: moment.Moment) {
  const endDate = validateDate(req, param);
  if (startDate.isAfter(endDate)) {
    throw new Error('End date must be after start date.');
  }

  return endDate;
}


function validateDateRange(startDate: moment.Moment, endDate: moment.Moment) {
  const range = Math.abs(endDate.diff(startDate, 'months'));
  if (range > 12) {
    throw new Error('No more than a year\'s worth of meetings can be fetched.');
  }
}


export function configureMeetingRoutes(app: Express,
                                       roomService: RoomService,
                                       meetingsService: MeetingsService): Express {

  const meetingsOps = new MeetingsOps(meetingsService);

  credentialedEndpoint(app, '/rooms/:listName/meetings', app.get, (req: Request, res: Response) => {
    logger.info('Fetching meetings');
    const listName = req.params['listName'];
    const credentials = req.body.credentials as Credentials;

    try {
      const start = validateDate(req, 'start');
      const end = validateEndDate(req, 'end', start);
      validateDateRange(start, end);

      const meetings = handleMeetingFetch(roomService, meetingsOps, credentials, listName, start, end);
      meetings.then(roomMeetings => res.json(roomMeetings));
    } catch (error) {
      return sendValidation(error, res);
    }
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting', app.post, (req, res) => {
    logger.info('About to create meeting', req.body);
    const credentials = req.body.credentials as TokenInfo;
    createMeeting(req, res, roomService, meetingsService, new Participant(credentials.user));
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting/:meetingId', app.delete, (req: Request, res: Response) => {
    const roomEmail = req.params['roomEmail'];
    const meetingId = req.params['meetingId'];

    handleMeetingDeletion(meetingsService, roomEmail, meetingId).then(() => res.json())
                                                                .catch(err => {
                                                                  sendGatewayError(err, res);
                                                                });
  });

  return app;
}


function handleMeetingFetch(roomService: RoomService,
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
                             logger.info('-----------------------------------------------------------');
                             const merged = mergeMeetings(roomMeetings, userMeetings);
                             return resolve(merged);
                           });
               })
               .catch((err) => {
                 reject(err);
               });
  });
}


function mergeMeetings(roomMeetings: RoomMeetings[], userMeetings: Meeting[]): RoomMeetings[] {
  const userMeetingsMap = userMeetings.reduce((acc, meeting) => {
    acc.set(meeting.id, meeting);
    return acc;
  }, new Map<string, Meeting>());

  logger.info('Merging meetings', roomMeetings);
  logger.info('Merging meetings', userMeetingsMap);

  return roomMeetings.map(roomNMeetings => {
    return {
      room: roomNMeetings.room,
      meetings: roomNMeetings.meetings.map(meeting => {
        const userMeeting = userMeetingsMap.get(meeting.id);
        logger.info('User meeting', meeting.id, userMeeting ? userMeeting.title : 'not found');
        return userMeeting ? userMeeting : meeting;
      })
    };
  });
}

function handleMeetingDeletion(meetingService: MeetingsService, roomEmail: string, meetingId: string): Promise<void> {
  return meetingService.deleteMeeting(new Participant(roomEmail), meetingId);
}
