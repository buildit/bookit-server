import {Meeting} from '../model/Meeting';
export interface Meetings {
  getMeetings(email: string, start: Date, end: Date): Promise<Meeting[]>;
}
