import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';

import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {MeetingsService} from './MeetingService';
import {isMeetingOverlapping} from '../../utils/validation';

export class InmemMeetingService implements MeetingsService {
  private store: Meeting[] = [];


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<Meeting> {
    return new Promise((resolve) => {
      const meeting: Meeting = {
        id: `guid-${Math.random().toString()}`,
        owner: owner,
        title: subj,
        start: start,
        end: start.clone().add(duration),
        participants: [owner, room],
      };
      this.store.push(meeting);
      // logger.debug('store', this.store);
      resolve(meeting);
    });
  }


  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const filtered = this.store.filter(meeting => meeting.id === meetingId);
      filtered.length > 0 ? resolve(filtered[0]) : reject('Unable to find meeting ' + meetingId);
    });
  }


  getMeetings(email: string, searchStart: moment.Moment, searchEnd: moment.Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const meetingFilter = (meeting: Meeting) => {
        const participantFound = () => meeting.participants.find(p => p.email === email);
        const meetingBounds = () => isMeetingOverlapping(meeting.start, meeting.end, searchStart, searchEnd);

        return participantFound() && meetingBounds();
      };

      // logger.trace('get store', this.store);
      const meetings = this.store.filter(meetingFilter);
      resolve(meetings);
    });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return new Promise((resolve) => {
      const idx = this.store.findIndex(m => m.id === id);
      if (idx >= 0) {
        this.store.splice(idx, 1);
      }
      resolve();
    });
  }
}
