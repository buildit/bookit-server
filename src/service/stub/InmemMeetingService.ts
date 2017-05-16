import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';

import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {MeetingsService} from '../MeetingService';
import {isMeetingOverlapping, isMomentWithinRange} from '../../utils/validation';

export class InmemMeetingService implements MeetingsService {
  private store: Meeting[] = [];


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
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
      resolve(meeting);
    });
  }


  getMeetings(email: string, searchStart: moment.Moment, searchEnd: moment.Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const meetingFilter = (meeting: Meeting) => {
        const participantFound = () => meeting.participants.find(p => p.email === email);
        const meetingBounds = () => isMeetingOverlapping(meeting.start, meeting.end, searchStart, searchEnd);

        return participantFound() && meetingBounds();
      };

      const meetings = this.store.filter(meetingFilter);
      resolve(meetings);
    });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return new Promise((resolve) => {
      const idx = this.store.findIndex(m => m.owner.email === owner && m.id === id);
      if (idx >= 0) {
        this.store.splice(idx, 1);
      }
      resolve();
    });
  }
}
