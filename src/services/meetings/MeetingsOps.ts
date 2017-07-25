import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../../model/Meeting';
import {isMeetingOverlapping} from '../../utils/validation';


function isOwner(meeting: Meeting, user: Participant) {
  return meeting.owner.email === user.email;
}


function isIdentifiedBy(meeting: Meeting, id: string) {
  return meeting.id === id;
}



function hasAnyMeetingConflicts(meetings: Meeting[], newMeetingStart: Moment, newMeetingEnd: Moment) {
  const conflict = meetings.find(meeting => {
    return isMeetingOverlapping(meeting.start, meeting.end, newMeetingStart, newMeetingEnd);
  });

  if (conflict) {
    throw 'Found conflict';
  }
}


function hasConflicts(meetings: Meeting[], start: Moment, end: Moment, originalId: string) {
  const conflict = meetings.find(meeting => {
    return meeting.id !== originalId && isMeetingOverlapping(meeting.start, meeting.end, start, end);
  });

  if (conflict) {
    throw 'Found conflict';
  }
}


function checkTime(meetingsService: MeetingsService,
                   room: Room,
                   start: Moment,
                   end: Moment,
                   validations: Array<(meeting: Meeting) => boolean>): Promise<any> {

  function checkValidations(meetings: Meeting[]) {
    return meetings.some(meeting => {
      return validations.some(validation => validation(meeting));
    });
  }

  return meetingsService.getMeetings(room, start, end)
                        .then(checkValidations);
}


function checkTimeIsAvailable(meetingsService: MeetingsService,
                              room: Room,
                              start: moment.Moment,
                              duration: moment.Duration): Promise<any> {
  const end = start.clone().add(duration);

  const timeValidation = (meeting: Meeting) => isMeetingOverlapping(meeting.start, meeting.end, start, end);
  return checkTime(meetingsService, room, start, end, [timeValidation]);
}


function checkMeetingTimeIsAvailable(meetingsService: MeetingsService,
                                     room: Room,
                                     id: string,
                                     start: Moment,
                                     duration: Duration): Promise<any> {
  const end = start.clone().add(duration);

  return meetingsService.getMeetings(room, start, end)
                        .then(meetings => hasConflicts(meetings, start, end, id));
}


export function createMeetingOperation(meetingService: MeetingsService,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room): Promise<Meeting> {

  return new Promise((resolve, reject) => {
    const ifAvailable = checkTimeIsAvailable(meetingService, room, start, duration);

    ifAvailable.then(() => meetingService.createMeeting(subj, start, duration, owner, room)
                                         .then(resolve)
                                         .catch(reject))
               .catch(reject);
  });
}

export function updateMeetingOperation(meetingService: MeetingsService,
                                       id: string,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room): Promise<Meeting> {

  return new Promise((resolve, reject) => {
    const ifAvailable = checkMeetingTimeIsAvailable(meetingService, room, id, start, duration);

    ifAvailable.then(() => meetingService.updateMeeting(id, subj, start, duration, owner, room)
                                         .then(resolve)
                                         .catch(reject))
               .catch(reject);
  });
}


export interface RoomMeetings {
  room: Room;
  meetings: Meeting[];
}


/**
 * TODO: deprecate
 *
 * This shouldn't be a class but a series of functions as there is no state being contained within the class.
 */
export class MeetingsOps {

  constructor(private meetingsService: MeetingsService) {
  };


  getRoomListMeetings(rooms: Room[], start: Moment, end: Moment): Promise<RoomMeetings[]> {
    const mapRoom = (room: Room) => {
      return this.meetingsService
                 .getMeetings(room, start, end)
                 .then(m => {
                   return {room, meetings: m};
                 });
    };

    return Promise.all(rooms.map(mapRoom));
  }


  getUserMeetings(owner: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    return this.meetingsService.getUserMeetings(owner, start, end);
  }


}
