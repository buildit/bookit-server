import * as moment from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {MeetingsService} from '../MeetingService';
import {Moment} from 'moment';

export class StubMeetingService implements MeetingsService {
  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve, reject) => {
      const hours = end.diff(start, 'hours');

      const res: Meeting[] = [];

      for (let i = 0; i < hours; i += 4) {

        const idx = (i / 4);

        res.push({
          id: `uuid-${idx}`,
          start: start.clone().add(i, 'hours'),
          end: start.clone().add(i + 1, 'hours'),
          title: `meeting ${idx}`,
          location: `location ${idx}`,
          participants: [{name: `part ${idx}`, email: `part-${idx}@designit.com`} as Participant],
          owner: {name: `owner ${idx}`, email: `owner-${idx}@designit.com`}
        });
      }
      resolve(res);
    });
  }

  createMeeting(subj: string, start: moment.Moment, duration: moment.Duration, owner: Participant, room: Participant): Promise<Meeting> {
    throw new Error('Not implemented for stub');
  }

  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    throw new Error('Method not implemented.');
  }

  deleteMeeting(owner: string, id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
