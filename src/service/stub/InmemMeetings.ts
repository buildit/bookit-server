import {Duration, Moment} from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {Meetings} from '../Meetings';
import * as moment from 'moment';

export class InmemMeetings implements Meetings {
  private store: Meeting[] = [];
  private lastEvent: Meeting;

  get lastAddedMeeting() {
    return this.lastEvent;

  }

  getStore(): Meeting[] {
    return this.store;
  }

  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    return new Promise((resolve) => {
      const meeting: Meeting = {
        id: `guid-${Math.random().toString()}`,
        owner,
        title: subj,
        start: start.toDate(),
        end: start.clone().add(duration).toDate(),
        participants: [owner, room],
      };
      this.store.push(meeting);
      resolve('OK');
    });
  }

  getMeetings(email: string, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const meetings = this.store.filter(m =>
      m.participants.find(p => p.email === email)
      && !(moment(m.start).isAfter(end) || moment(m.end).isBefore(start)));
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
