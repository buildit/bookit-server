import * as moment from 'moment';
import {Express, Request, Response, Router} from 'express';
import {start} from 'repl';

import {Participant} from '../../model/Participant';

import {MeetingsService} from '../../services/meetings/MeetingService';
import {MeetingsOps, RoomMeetings} from '../../services/meetings/MeetingsOps';
import {RoomService} from '../../services/rooms/RoomService';
import {RootLog as logger} from '../../utils/RootLogger';
import {extractAsMoment} from '../../utils/validation';

import {checkParam, sendError, sendGatewayError, sendNotFound} from '../rest_support';
import {credentialedEndpoint, protectedEndpoint} from '../filters';
import {TokenInfo} from '../auth_routes';
import {createMeeting} from './meeting_functions';
import {Credentials} from '../../model/Credentials';


export interface MeetingRequest {
  readonly title: string;
  readonly start: string;
  readonly end: string;
}


export function configureMeetingRoutes(app: Express,
                                       roomService: RoomService,
                                       meetingsService: MeetingsService): Express {

  const meetingsOps = new MeetingsOps(meetingsService);

  credentialedEndpoint(app, '/rooms/:listName/meetings', app.get, (req: Request, res: Response) => {
    logger.info('Fetching meetings');
    const listName = req.params['listName'];
    const credentials = req.body.credentials as Credentials;
    const start = extractAsMoment(req, 'start');
    const end = extractAsMoment(req, 'end');

    const range = end.diff(start, 'months');
    logger.info(start.format() as string);
    logger.info(end.format() as string);


    if (checkParam(start || end as any, 'At least one of the following must be supplied: start, end', res)
      && checkParam(start.isValid(), 'Start date is not valid', res)
      && checkParam(end.isValid(), 'End date is not valid', res)
      && checkParam(end.isAfter(start), 'End date must be after start date', res)
      && checkParam(range < 12 && range > -12, 'No more than a year at a time', res)) {

    }

    handleMeetingFetch(roomService, meetingsOps, credentials, listName, start, end).then(roomMeetings => res.json(roomMeetings));
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting', app.post, (req, res) => {
    const credentials = req.body.credentials as TokenInfo;
    createMeeting(req, res, roomService, meetingsService, new Participant(credentials.user));
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting/:meetingId', app.delete, (req: Request, res: Response) => {
    const roomEmail = req.params['roomEmail'];
    const meetingId = req.params['meetingId'];

    handleMeetingDeletion(meetingsService, roomEmail, meetingId).then(() => res.json)
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
               .then(room => {
                 // logger.info('getting meetings', room.rooms);
                 return room.rooms;
               })
               .then(rooms => {
                 return meetingOps.getRoomListMeetings(rooms, start, end);
                                  // .then(resolve)
                                  // .catch((err) => reject(err));
               })
               .then(roomMeetings => {
                 if (!credentials) {
                   logger.info('CREDS', credentials);
                   logger.info('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                   return resolve(roomMeetings);
                 }

                 logger.info('-----------------------------------------------------------');
                 return resolve([]);
               })
               .catch((err) => {
                 reject(err);
               });
  });
}


function handleMeetingDeletion(meetingService: MeetingsService, roomEmail: string, meetingId: string): Promise<void> {
  return meetingService.deleteMeeting(new Participant(roomEmail), meetingId);
}
