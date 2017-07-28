import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../../model/Meeting';
import {isMeetingOverlapping} from '../../utils/validation';


function hasAnyMeetingConflicts(meetings: Meeting[], newMeetingStart: moment.Moment, newMeetingEnd: moment.Moment) {
  const conflict = meetings.find(meeting => {
    return isMeetingOverlapping(moment(meeting.start), moment(meeting.end), newMeetingStart, newMeetingEnd);
  });

  if (conflict) {
    throw 'Found conflict';
  }
}


function hasConflicts(meetings: Meeting[], originalId: string, start: Moment, end: Moment) {
  const conflict = meetings.find(meeting => {
    logger.info(`Checking conflict: ${meeting.id} against ${originalId}`);
    return meeting.id !== originalId && isMeetingOverlapping(meeting.start, meeting.end, start, end);
  });

  if (conflict) {
    throw 'Found other meeting conflict';
  }
}


function checkTimeIsAvailable(meetingsService: MeetingsService,
                              room: Room,
                              start: moment.Moment,
                              duration: moment.Duration): Promise<any> {
  const end = start.clone().add(duration);

  return meetingsService.getMeetings(room, start, end)
                        .then(meetings => hasAnyMeetingConflicts(meetings, start, end));
}


function checkMeetingTimeIsAvailable(meetingsService: MeetingsService,
                                     room: Room,
                                     userMeetingId: string,
                                     start: Moment,
                                     duration: Duration): Promise<any> {
  const end = start.clone().add(duration);
  return meetingsService.getMeetings(room, start, end)
                        .then(meetings => hasConflicts(meetings, userMeetingId, start, end));
}


export function createMeetingOperation(meetingService: MeetingsService,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room): Promise<Meeting> {

  return new Promise((resolve, reject) => {
    const ifAvailable = checkTimeIsAvailable(meetingService, room, start, duration);

    ifAvailable.then(() => meetingService.createUserMeeting(subj, start, duration, owner, room)
                                         .then(resolve)
                                         .catch(reject))
               .catch(reject);
  });
}

export function updateMeetingOperation(meetingService: MeetingsService,
                                       userMeetingId: string,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room): Promise<Meeting> {

  return new Promise((resolve, reject) => {
    const ifAvailable = checkMeetingTimeIsAvailable(meetingService, room, userMeetingId, start, duration);

    ifAvailable.then(() => meetingService.updateUserMeeting(userMeetingId, subj, start, duration, owner, room)
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


  // getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
  //   logger.debug('Getting meetings', this.meetingsService);
  //   return this.meetingsService.getMeetings(room, start, end);
  // }
  //
  //
  // findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
  //   return this.meetingsService.findMeeting(room, meetingId, start, end);
  // }


  // createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
  //   return promiseCreateMeeting(this.meetingsService, subj, start, duration, owner, room);
  // }


  // deleteMeeting(owner: Participant, id: string): Promise<any> {
  //   return this.meetingsService.deleteMeeting(owner, id);
  // }


}
