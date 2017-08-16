import {Meeting} from '../../model/Meeting';
import {Duration, Moment} from 'moment';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';

export interface MeetingsService {
  domain(): string;


  clearCaches(): boolean;


  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]>;


  getUserMeetings(user: Participant, start: Moment, end: Moment): Promise<Meeting[]>;


  createUserMeeting(subj: string,
                    start: Moment,
                    duration: Duration,
                    owner: Participant,
                    room: Participant): Promise<Meeting>;


  updateUserMeeting(id: string,
                    subj: string,
                    start: Moment,
                    duration: Duration,
                    owner: Participant,
                    room: Participant): Promise<Meeting>;


  deleteUserMeeting(owner: Participant, id: string): Promise<any>;


  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting>;

  /**
   * this is a catch all hack to quickly test the MS API without having to modify the full MeetingService interface
   * @param test
   */
  doSomeShiznit(test: any): Promise<any>;
}
