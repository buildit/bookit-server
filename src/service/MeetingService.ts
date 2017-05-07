import {Meeting} from '../model/Meeting';
import {Duration, Moment} from 'moment';
import {Participant} from '../model/Participant';

export interface MeetingsService {
  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]>;

  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any>;

  deleteMeeting(owner: string, id: string): Promise<any>;
}
