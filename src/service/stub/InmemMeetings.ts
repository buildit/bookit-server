import {Duration, Moment} from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {Meetings} from '../Meetings';
import * as moment from 'moment';

export class InmemMeetings implements Meetings {
  private store: Map<string, Meeting[]> = new Map();
  private lastEvent: Meeting;

  get lastAddedMeeting() {
    return this.lastEvent;

  }

  createEvent(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    return new Promise((resolve) => {
      let meetings = this.store.get(room.email);
      if (!meetings) {
        meetings = [];
        this.store.set(room.email, meetings);
      }
      const meeting: Meeting = {
        id: `guid-${Math.random().toString()}`,
        owner,
        title: subj,
        start: start.toDate(),
        end: start.clone().add(duration).toDate(),
        participants: [owner, room],
      };
      meetings.push(meeting);
      this.store.set(room.email, meetings);
      this.lastEvent = meeting;
      resolve();
    });
  }

  getMeetings(email: string, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const meetings = this.store.get(email) || [];
      resolve(meetings.filter(m => moment(m.start).isBetween(start, end)));
    });
  }

  deleteEvent(owner: string, id: string): Promise<any> {
    return new Promise((resolve) => {
      this.store.forEach((meetings, room) => {
        this.store.set(room, meetings.filter(m => m.owner.email !== owner || m.id !== id));
      });
      resolve();
    });
  }
}
