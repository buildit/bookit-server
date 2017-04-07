import {Meeting} from '../model/Meeting';
import {Duration, Moment} from 'moment';
import {Participant} from '../model/Participant';

export interface Meetings {
  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]>;

  createEvent(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any>;

  deleteEvent(owner: string, id: string): Promise<any>;

}
