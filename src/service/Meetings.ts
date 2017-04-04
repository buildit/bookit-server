import {Meeting} from '../model/Meeting';
import {Moment} from 'moment';
export interface Meetings {
  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]>;
}
