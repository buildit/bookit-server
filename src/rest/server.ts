import {AppConfig} from '../config';
import {TokenOperations} from '../service/TokenOperations';
import {GraphAPI} from '../service/GraphAPI';
import {StubRooms} from '../service/stub/StubRooms';
import * as assert from 'assert';
import {StubMeetings} from '../service/stub/StubMeetings';
import {Express, Request, Response} from 'express';
import {RootLog as logger} from '../utils/RootLogger';
import * as moment from 'moment';
import {Rooms} from '../service/Rooms';
import {Meetings} from '../service/Meetings';

// Services
// TODO: DI kicks in here
export function registerBookitRest(app: Express,
                                   roomSvc: Rooms = new StubRooms(),
                                   meetingSvc: Meetings = new StubMeetings()): Express {
  app.get('/', (req, res) => {
    console.log(req);
    res.send('done');
  });
  app.get('/test', (req, res) => {

    new TokenOperations(AppConfig).withToken()
      .then((token) => {
        console.log(`Token is ${token}`);
        return new GraphAPI().getUsers(token);
      })
      .then(users =>
        res.send(JSON.stringify(users)))
      .catch((err) => {
        sendError(err, res);
      });
  });

  function roomList(req: Request): string {
    return req.params.listName;
    // todo: add listName name validation
  }

  app.get('/rooms/:listName', (req, res) => {
    const listName = roomList(req);
    assert(listName, 'List name can\'t be empty');
    const rooms = roomSvc.getRooms(listName);
    res.json(rooms);
  });

  function sendError(err: any, res: Response) {
    res.status(500);
    res.json({message: err});
    res.end();
  }

  function sendValidation(err: any, res: Response) {
    res.status(400);
    res.json({message: err});
    res.end();
  }

  function checkParam(cond: boolean, message: string, res: Response): boolean {
    if (!cond) {
      sendValidation(message, res);
      return false;
    }
    return true;
  }

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

      logger.debug(`Start is ${start} and end is ${end}`);

      Promise.all(roomSvc.getRooms(roomList(req))
        .map(room =>
          meetingSvc.getMeetings(room.email, start.toDate(), end.toDate())
            .then(m => {
              logger.debug(JSON.stringify(m));
              return {room, meetings: m};
            })))
        .then(meetingList => {
          logger.debug(JSON.stringify(meetingList));
          res.json(meetingList);
        })
        .catch(err => {
          sendError(err, res);
        });
    }
  });
  return app;
}
