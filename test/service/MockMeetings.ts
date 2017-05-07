import {Moment, Duration} from 'moment';

import {Meeting} from '../../src/model/Meeting';
import {Participant} from '../../src/model/Participant';
import {Meetings} from '../../src/service/Meetings';

export class MockMeetings implements Meetings {

  lastAdded: any;

  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    this.lastAdded = {subj, start, duration, owner, room};
    return new Promise((resolve, reject) => {
      resolve({data: 'new event'});
    });
  }

  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      resolve([] as Meeting[]);
    });
  }

  deleteMeeting(owner: string, id: string): Promise<any> {
    throw 'NOT USED';
  }
}
