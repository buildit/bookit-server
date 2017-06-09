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
import {Room} from '../model/Room';


function extractRoomListName(req: Request): string {
  return req.params.listName;
  // todo: add listName name validation
}


// Services
export function  getCurrentUser(domain: string = 'myews'): Participant {
  return {name: 'Comes from the session!!!', email: `bruce@${domain}.onmicrosoft.com`};
}


export function configureMeetingRoutes(app: Express,
                                       roomSvc: RoomService,
                                       meetingSvc: MeetingsService): Express {

  const meetingsOps = new MeetingsOps(meetingSvc);

  app.get('/rooms/:listName', (req, res) => {
    const listName = extractRoomListName(req);
    assert(listName, 'List name can\'t be empty');
    roomSvc.getRoomList(listName).then(roomList => {
      res.json(roomList.rooms);
    });
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

      roomSvc.getRoomList(listName)
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


  function createMeeting(req: any, res: any, owner: Participant) {
    const event = req.body as MeetingRequest;
    const startMoment = moment(event.start);
    const endMoment = moment(event.end);
    const roomId = req.params.roomEmail;

    logger.info('Want to create meeting:', event);
    const createMeeting = (room: Room) => {
      meetingsOps.createMeeting(event.title,
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

      roomSvc.getRoomByName(roomId)
             .then(createMeeting)
             .catch(() => roomSvc.getRoomByMail(roomId))
             .then(createMeeting)
             .catch(err => sendError(err, res));
    }

  }

  app.post('/room/:roomEmail/meeting', (req, res) => {
    return createMeeting(req, res, getCurrentUser(meetingSvc.domain()));
  });


  protectEndpoint(app, '/room/:roomEmail/meeting_protected');
  app.post('/room/:roomEmail/meeting_protected', (req, res) => {
    const credentials = req.body.credentials as TokenInfo;
    return createMeeting(req, res, new Participant(credentials.user));
  });


  app.delete('/room/:roomEmail/meeting/:meetingId', (req, res) => {
    const roomEmail = req.param('roomEmail');
    const meetingId = req.param('meetingId');

    meetingsOps.deleteMeeting(meetingId)
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
