import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../../model/Meeting';
import {isMeetingOverlapping} from '../../utils/validation';


function hasConflicts(meetings: Meeting[], newMeetingStart: moment.Moment, newMeetingEnd: moment.Moment) {
  const conflict = meetings.find(meeting => {
    return isMeetingOverlapping(moment(meeting.start), moment(meeting.end), newMeetingStart, newMeetingEnd);
  });

  if (conflict) {
    throw 'Found conflict';
  }
}


function checkTimeIsAvailable(meetingsService: MeetingsService,
                              room: Room,
                              start: moment.Moment,
                              duration: moment.Duration): Promise<any> {
  const end = start.clone().add(duration);

  return meetingsService.getMeetings(room, start, end)
                        .then(meetings => hasConflicts(meetings, start, end));
}




export class MeetingsOps {

  constructor(private meetingsService: MeetingsService) {
  };


  getRoomListMeetings(rooms: Room[], start: Moment, end: Moment) {
    const mapRoom = (room: Room) => {
      return this.meetingsService
                 .getMeetings(room, start, end)
                 .then(m => {
                   return {room, meetings: m};
                 })
                 .catch(error => {
                   logger.error(error);
                 });
    };

    return Promise.all(rooms.map(mapRoom));
  }


  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    logger.debug('Getting meetings', this.meetingsService);
    return this.meetingsService.getMeetings(room, start, end);
  }


  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return this.meetingsService.findMeeting(room, meetingId, start, end);
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const promisedCheck = checkTimeIsAvailable(this.meetingsService, room, start, duration);

      promisedCheck.then(() => this.meetingsService
                                   .createMeeting(subj, start, duration, owner, room)
                                   .then(resolve)
                                   .catch(reject))
                   .catch(reject);
    });
  }


  deleteMeeting(owner: Participant, id: string): Promise<any> {
    return this.meetingsService.deleteMeeting(owner, id);
  }


}
