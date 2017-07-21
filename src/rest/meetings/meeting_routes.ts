import * as moment from 'moment';
import {Express, Request, Response, Router} from 'express';
import {start} from 'repl';

import {Participant} from '../../model/Participant';

import {MeetingsService} from '../../services/meetings/MeetingService';
import {MeetingsOps, RoomMeetings} from '../../services/meetings/MeetingsOps';
import {RoomService} from '../../services/rooms/RoomService';
import {RootLog as logger} from '../../utils/RootLogger';
import {extractQueryParamAsMoment} from '../../utils/validation';

import {sendGatewayError, sendValidation} from '../rest_support';
import {credentialedEndpoint, protectedEndpoint} from '../filters';
import {TokenInfo} from '../auth_routes';
import {
  createMeeting, handleMeetingDeletion, handleMeetingFetch, updateMeeting, validateTimes, validateTitle
} from './meeting_functions';
import {Credentials} from '../../model/Credentials';


export interface MeetingRequest {
  readonly id?: string;
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

    try {
      const start = extractQueryParamAsMoment(req, 'start');
      const end = extractQueryParamAsMoment(req, 'end');
      validateTimes(start, end);

      const meetings = handleMeetingFetch(roomService, meetingsOps, credentials, listName, start, end);
      meetings.then(roomMeetings => res.json(roomMeetings));
    } catch (error) {
      return sendValidation(error, res);
    }
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting', app.post, (req: Request, res: Response) => {
    logger.debug('About to create meeting', req.body);
    const credentials = req.body.credentials as TokenInfo;
    const event = req.body as MeetingRequest;

    try {
      validateTitle(event.title);
      const start = moment(event.start);
      const end = moment(event.end);
      validateTimes(start, end);

      createMeeting(req, res, roomService, meetingsService, new Participant(credentials.user));
    } catch (error) {
      return sendValidation(error, res);
    }
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting', app.put, (req: Request, res: Response) => {
    logger.debug('About to update meeting', req.body);
    const credentials = req.body.credentials as TokenInfo;
    const event = req.body as MeetingRequest;

    try {
      validateTitle(event.title);
      const start = moment(event.start);
      const end = moment(event.end);
      validateTimes(start, end);

      updateMeeting(req, res, roomService, meetingsService, new Participant(credentials.user));
    } catch (error) {
      return sendValidation(error, res);
    }
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



