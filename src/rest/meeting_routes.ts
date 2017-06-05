import * as assert from 'assert';
import * as moment from 'moment';
import {Express, Request, Response, Router} from 'express';
import {start} from 'repl';

import {Participant} from '../model/Participant';

import {MeetingsService} from '../services/meetings/MeetingService';
import {MeetingsOps} from '../services/meetings/MeetingsOps';
import {RoomService} from '../services/rooms/RoomService';
import {RootLog as logger} from '../utils/RootLogger';
import {extractAsMoment} from '../utils/validation';

import {checkParam, sendError, sendGatewayError, sendNotFound} from './rest_support';
import {protectEndpoint} from './filters';
import {TokenInfo} from './auth_routes';


function roomList(req: Request): string {
  return req.params.listName;
  // todo: add listName name validation
}


// Services
export function  getCurrentUser(): Participant {
  return {name: 'Comes from the session!!!', email: 'romans@myews.onmicrosoft.com'};
}


export function configureMeetingRoutes(app: Express,
                                       roomSvc: RoomService,
                                       meetingSvc: MeetingsService): Express {

  const meetingsOps = new MeetingsOps(meetingSvc);

  app.get('/rooms/:listName', (req, res) => {
    const listName = roomList(req);
    assert(listName, 'List name can\'t be empty');
    const rooms = roomSvc.getRooms(listName);
    res.json(rooms);
  });


  app.get('/rooms/:listName/meetings', (req, res) => {
    const listName = req.param('listName');
    const start = extractAsMoment(req, 'start');
    const end = extractAsMoment(req, 'end');

    // TODO: Pull param validation out.
    logger.info(req.param('start'), req.param('end'), start.isValid(), end.isValid());
    if (!start.isValid() || !end.isValid()) {
      res.status(400).send();
    }

    logger.info(`Getting meetings for ${listName}`);
    // range validation!!
    const range = end.diff(start, 'months');
    logger.debug(start.format() as string);
    logger.debug(end.format() as string);

    if (checkParam(start || end as any, 'At least one of the following must be supplied: start, end', res)
      && checkParam(start.isValid(), 'Start date is not valid', res)
      && checkParam(end.isValid(), 'End date is not valid', res)
      && checkParam(end.isAfter(start), 'End date must be after start date', res)
      && checkParam(range < 12 && range > -12, 'No more than a year at a time', res)) {

      const roomResponse = roomSvc.getRooms(roomList(req));

      if (!roomResponse.found) {
        sendNotFound(res);
      } else {
        meetingsOps.getRoomListMeetings(roomResponse.rooms, start, end)
                   .then(result => res.json(result))
                   .catch(err => sendError(err, res));
      }
    }
  });


  protectEndpoint(app, '/room/:roomEmail/meeting');
  app.post('/room/:roomEmail/meeting', (req, res) => {
    const event = req.body as MeetingRequest;
    const startMoment = moment(event.start);
    const endMoment = moment(event.end);
    if (checkParam(event.title && event.title.trim().length > 0, 'Title must be provided', res)
      && checkParam(startMoment.isValid(), 'Start date must be provided', res)
      && checkParam(endMoment.isValid(), 'End date must be provided', res)
      && checkParam(endMoment.isAfter(startMoment), 'End date must be after start date', res)) {


      meetingsOps.createMeeting(event.title,
                                startMoment,
                                moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes'),
                                getCurrentUser(),
                                {name: 'room', email: req.params.roomEmail})
                 .then(meeting => res.json(meeting))
                 .catch(err => sendError(err, res));
    }
  });


  protectEndpoint(app, '/room/:roomEmail/meeting_protected');
  app.post('/room/:roomEmail/meeting_protected', (req, res) => {
    const credentials = req.body.credentials as TokenInfo;
    const event = req.body as MeetingRequest;
    const startMoment = moment(event.start);
    const endMoment = moment(event.end);
    if (checkParam(event.title && event.title.trim().length > 0, 'Title must be provided', res)
      && checkParam(startMoment.isValid(), 'Start date must be provided', res)
      && checkParam(endMoment.isValid(), 'End date must be provided', res)
      && checkParam(endMoment.isAfter(startMoment), 'End date must be after start date', res)) {


      meetingsOps.createMeeting(event.title,
                                startMoment,
                                moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes'),
                                new Participant(credentials.user),
                                {name: 'room', email: req.params.roomEmail})
                 .then(meeting => res.json(meeting))
                 .catch(err => sendError(err, res));
    }
  });


  app.delete('/room/:roomEmail/meeting/:meetingId', (req, res) => {
    const roomEmail = req.param('roomEmail');
    const meetingId = req.param('meetingId');

    meetingsOps.deleteMeeting(roomEmail, meetingId)
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
