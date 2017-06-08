import {Meeting} from '../../model/Meeting';
import {Duration, Moment} from 'moment';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';

export interface MeetingsService {
  domain(): string;

  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]>;

  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<Meeting>;

  deleteMeeting(owner: string, id: string): Promise<any>;

  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting>;
}
