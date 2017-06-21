import * as moment from 'moment';
import {Request, Response} from 'express';

import {Participant} from '../../model/Participant';

import {RootLog as logger} from '../../utils/RootLogger';

import {checkParam, sendError} from '../rest_support';
import {Room} from '../../model/Room';
import {MeetingRequest} from './meeting_routes';
import {RoomService} from '../../services/rooms/RoomService';
import {MeetingsService} from '../../services/meetings/MeetingService';
import {createMeetingOperation} from '../../services/meetings/MeetingsOps';


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


