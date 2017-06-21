import * as moment from 'moment';
import {Express, Request, Response, Router} from 'express';
import {start} from 'repl';

import {Participant} from '../../model/Participant';

import {MeetingsService} from '../../services/meetings/MeetingService';
import {MeetingsOps} from '../../services/meetings/MeetingsOps';
import {RoomService} from '../../services/rooms/RoomService';
import {RootLog as logger} from '../../utils/RootLogger';
import {extractAsMoment} from '../../utils/validation';

import {checkParam, sendError, sendGatewayError, sendNotFound} from '../rest_support';
import {credentialedEndpoint, protectedEndpoint} from '../filters';
import {TokenInfo} from '../auth_routes';
import {createMeeting} from './meeting_functions';


// Services
export function  getCurrentUser(domain: string = 'myews'): Participant {
  return new Participant(`bruce@${domain}.onmicrosoft.com`);
}


export function configureMeetingRoutes(app: Express,
                                       roomService: RoomService,
                                       meetingsService: MeetingsService): Express {

  const meetingsOps = new MeetingsOps(meetingsService);


  credentialedEndpoint(app, '/rooms/:listName/meetings', app.get, (req: Request, res: Response) => {
    const listName = req.param('listName');
    const start = extractAsMoment(req, 'start');
    const end = extractAsMoment(req, 'end');

    // TODO: Pull param validation out.
    logger.info(req.param('start'), req.param('end'), start.isValid(), end.isValid());
    if (!start.isValid() || !end.isValid()) {
      res.status(400).send();
    }

    logger.info(`Getting meetings for ${listName} from ${start} to ${end}`);
    // range validation!!
    const range = end.diff(start, 'months');
    logger.debug(start.format() as string);
    logger.debug(end.format() as string);

    if (checkParam(start || end as any, 'At least one of the following must be supplied: start, end', res)
      && checkParam(start.isValid(), 'Start date is not valid', res)
      && checkParam(end.isValid(), 'End date is not valid', res)
      && checkParam(end.isAfter(start), 'End date must be after start date', res)
      && checkParam(range < 12 && range > -12, 'No more than a year at a time', res)) {

      roomService.getRoomList(listName)
                 .then(room => {
                   logger.info('getting meetings', room.rooms);
                   return room.rooms;
                 })
                 .then(rooms => {
                   meetingsOps.getRoomListMeetings(rooms, start, end)
                              .then(result => res.json(result))
                              .catch(err => sendError(err, res));
                 })
                 .catch(() => {
                   sendNotFound(res);
                 });
    }
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting', app.post, (req, res) => {
    return createMeeting(req, res, roomService, meetingsService, getCurrentUser(meetingsService.domain()));
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting_protected', app.post, (req, res) => {
    const credentials = req.body.credentials as TokenInfo;
    return createMeeting(req, res, roomService, meetingsService, new Participant(credentials.user));
  });


  protectedEndpoint(app, '/room/:roomEmail/meeting/:meetingId', app.delete, (req: Request, res: Response) => {
    const roomEmail = req.get('roomEmail');
    const meetingId = req.get('meetingId');

    logger.info('Want to delete meeting', roomEmail, meetingId);
    meetingsService.deleteMeeting(new Participant(roomEmail), meetingId)
                   .then(() => res.json())
                   .catch(error => {
                     sendGatewayError(error, res);
                   });
  });

  return app;
}

export interface MeetingRequest {
  readonly title: string;
  readonly start: string;
  readonly end: string;
}
