import * as assert from 'assert';
import * as bodyParser from 'body-parser';
import {Express, Request, Response} from 'express';
import * as moment from 'moment';
import {start} from 'repl';
import {AppConfig} from '../config/config';
import {Participant} from '../model/Participant';
import {GraphAPI} from '../service/GraphAPI';
import {Meetings} from '../service/Meetings';
import {MeetingsOps} from '../service/MeetingsOps';
import {Rooms} from '../service/Rooms';
import {StubRooms} from '../service/stub/StubRooms';
import {TokenOperations} from '../service/TokenOperations';
import {Services} from '../Services';
import {RootLog as logger} from '../utils/RootLogger';


function roomList(req: Request): string {
  return req.params.listName;
  // todo: add listName name validation
}

function sendStatus(data: any, statusCode: number, res: Response) {
  res.status(statusCode);
  res.json(data);
  res.end();
}

function sendError(err: any, res: Response) {
  logger.error(err);
  sendStatus({message: err}, 500, res);
}

function sendValidation(err: any, res: Response) {
  sendStatus({message: err}, 400, res);
}

function sendNotFound(res: Response, message: string = 'Not found') {
  sendStatus({message}, 404, res);
}

function checkParam(cond: boolean, message: string, res: Response): boolean {
  if (!cond) {
    sendValidation(message, res);
    return false;
  }
  return true;
}
// Services
// TODO: DI kicks in here
function getCurrentUser(): Participant {
  // TODO: comes from user context (cookie / jwt)
  return {name: 'Comes from the session!!!', email: 'romans@myews.onmicrosoft.com'};
}
export function registerBookitRest(app: Express,
                                   roomSvc: Rooms = new StubRooms(),
                                   meetingSvc: Meetings = Services.meetings): Express {

  app.use(bodyParser.json());

  const meetingsOps = new MeetingsOps(meetingSvc);

  app.get('/', (req, res) => {
    res.send('done');
  });
  app.get('/test', (req, res) => {

    new TokenOperations(AppConfig.graphApi).withToken()
      .then((token) => {
        return new GraphAPI().getUsers(token);
      })
      .then(users =>
        res.send(JSON.stringify(users)))
      .catch((err) => {
        sendError(err, res);
      });
  });

  app.get('/rooms/:listName', (req, res) => {
    const listName = roomList(req);
    assert(listName, 'List name can\'t be empty');
    const rooms = roomSvc.getRooms(listName);
    res.json(rooms);
  });

  app.get('/rooms/:listName/meetings', (req, res) => {
    const startParam = req.param('start');
    let start = moment(startParam);
    const endParam = req.param('end');
    let end = moment(endParam);

    // range validation!!
    const range = end.diff(start, 'months');
    logger.debug(start.format() as string);
    logger.debug(end.format() as string);

    if (checkParam(startParam || endParam as any, 'At least one of the following must be supplied: start, end', res)
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

  app.post('/room/:roomEmail/meeting', (req, res) => {
    const event = req.body as MeetingRequest;
    const startMoment = moment(event.start);
    const endMoment = moment(event.end);
    if (checkParam(event.title !== null && event.title.trim().length > 0, 'Title must be provided', res)
      && checkParam(startMoment.isValid(), 'Start date must be provided', res)
      && checkParam(endMoment.isValid(), 'End date must be provided', res)
      && checkParam(endMoment.isAfter(startMoment), 'End date must be after start date', res)) {

      meetingsOps.createEvent(
        event.title,
        startMoment,
        moment.duration(endMoment.diff(startMoment, 'minutes'), 'minutes'),
        getCurrentUser(), {name: 'room', email: req.params.roomEmail})
        .then(() => {
          // FIXME: should return instance of just created event
          res.send(JSON.stringify('OK'));
        })
        .catch(err => sendError(err, res));
    }
  });
  return app;
}

export interface MeetingRequest {
  readonly title: string;
  readonly start: string;
  readonly end: string;
}
