import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../utils/RootLogger';
import {Participant} from '../model/Participant';
import {Room} from '../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../model/Meeting';
import {isMeetingOverlapping} from '../utils/validation';

export class MeetingsOps {

  constructor(private meetingSvc: MeetingsService) {
  };


  getRoomListMeetings(rooms: Room[], start: Moment, end: Moment) {
    // FIXME: must use queue!!!
    // TODO: figure out why

    const mapRoom = (room: Room) => {
      return this.meetingSvc
                 .getMeetings(room.email, start, end)
                 .then(m => {
                   return {room, meetings: m};
                 });
    };

    return Promise.all(rooms.map(mapRoom));
  }


  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return this.meetingSvc.getMeetings(email, start, end);
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    return new Promise((resolve, reject) => {
      this.checkTimeIsAvailable(room, start, duration)
          .then(() => {
            this.meetingSvc.createMeeting(subj, start, duration, owner, room)
                .then(resolve)
                .catch(reject);
          })
          .catch(reject);
    });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return this.meetingSvc.deleteMeeting(owner, id);
  }


  private checkTimeIsAvailable(calendarOwner: Participant,
                               start: moment.Moment,
                               duration: moment.Duration): Promise<any> {
    const end = start.clone().add(duration);

    return this.meetingSvc
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
