import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../utils/RootLogger';
import {Participant} from '../model/Participant';
import {Room} from '../model/Room';
import {MeetingsService} from './meetings/MeetingService';
import {Meeting} from '../model/Meeting';
import {isMeetingOverlapping} from '../utils/validation';

export class MeetingsOps {

  constructor(private meetingsService: MeetingsService) {
  };


  getRoomListMeetings(rooms: Room[], start: Moment, end: Moment) {
    // FIXME: must use queue!!!
    // TODO: figure out why

    const mapRoom = (room: Room) => {
      return this.meetingsService
                 .getMeetings(room.email, start, end)
                 .then(m => {
                   return {room, meetings: m};
                 });
    };

    return Promise.all(rooms.map(mapRoom));
  }


  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    // logger.debug('Getting meetings', this.meetingsService);
    return this.meetingsService.getMeetings(email, start, end);
  }


  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return this.meetingsService.findMeeting(email, meetingId, start, end);
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      this.checkTimeIsAvailable(room, start, duration)
          .then(() => {
            this.meetingsService.createMeeting(subj, start, duration, owner, room)
                .then(resolve)
                .catch(reject);
          })
          .catch(reject);
    });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return this.meetingsService.deleteMeeting(owner, id);
  }


  private checkTimeIsAvailable(calendarOwner: Participant,
                               start: moment.Moment,
                               duration: moment.Duration): Promise<any> {
    const end = start.clone().add(duration);

    return this.meetingsService
               .getMeetings(calendarOwner.email, start, end)
               .then(meetings => this.hasConflicts(meetings, start, end));
  }


  private hasConflicts(meetings: Meeting[], newMeetingStart: moment.Moment, newMeetingEnd: moment.Moment) {
    const conflict = meetings.find(meeting => {
      return isMeetingOverlapping(moment(meeting.start), moment(meeting.end), newMeetingStart, newMeetingEnd);
    });

    if (conflict) {
      throw 'Found conflict';
    }
  }

}
