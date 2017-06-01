import {Moment, Duration} from 'moment';

import {Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import {MeetingsService} from '../../../src/services/meetings/MeetingService';

export class MockMeetings implements MeetingsService {

  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({data: 'new event'});
    });
  }

  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      resolve([] as Meeting[]);
    });
  }

  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return undefined;
  }

  deleteMeeting(owner: string, id: string): Promise<any> {
    throw 'NOT USED';
  }
}
