import * as moment from 'moment';
import {Express, Request, Response, Router} from 'express';
import {start} from 'repl';

import {Participant} from '../../model/Participant';

import {MeetingsService} from '../../services/meetings/MeetingService';
import {MeetingsOps, RoomMeetings} from '../../services/meetings/MeetingsOps';
import {RoomService} from '../../services/rooms/RoomService';
import {RootLog as logger} from '../../utils/RootLogger';
import {extractAsMoment} from '../../utils/validation';

import {sendGatewayError, sendValidation} from '../rest_support';
import {credentialedEndpoint, protectedEndpoint} from '../filters';
import {TokenInfo} from '../auth_routes';
import {
  createMeeting, handleMeetingDeletion, handleMeetingFetch, validateDate, validateDateRange,
  validateEndDate
} from './meeting_functions';
import {Credentials} from '../../model/Credentials';
import {Meeting} from '../../model/Meeting';


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


  protectedEndpoint(app, '/room/:roomEmail/meeting', app.post, (req: Request, res: Response) => {
    logger.debug('About to create meeting', req.body);
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



