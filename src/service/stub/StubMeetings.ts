import * as moment from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {Meetings} from '../Meetings';
import {Moment} from 'moment';

export class StubMeetings implements Meetings {
  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve, reject) => {
      const hours = end.diff(start, 'hours');

      const res: Meeting[] = [];

      for (let i = 0; i < hours; i += 4) {

        const idx = (i / 4);

        res.push({
          id: `uuid-${idx}`,
          start: start.clone().add(i, 'hours').toDate(),
          end: start.clone().add(i + 1, 'hours').toDate(),
          title: `meeting ${idx}`,
          location: `location ${idx}`,
          participants: [{name: `part ${idx}`, email: `part-${idx}@designit.com`} as Participant]
        });
      }
      resolve(res);
    });
  }
}
