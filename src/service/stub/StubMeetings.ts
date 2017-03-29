import * as moment from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {Meetings} from '../Meetings';

export class StubMeetings implements Meetings {
  getMeetings(email: string, start: Date, end: Date): Promise<Meeting[]> {
    return new Promise((resolve, reject) => {
      const startMoment = moment(start);
      const endMoment = moment(end);
      const hours = endMoment.diff(startMoment, 'hours');

      const res: Meeting[] = [];

      for (let i = 0; i < hours; i += 4) {

        const idx = (i / 4);

        res.push({
          start: startMoment.clone().add(i, 'hours').toDate(),
          end: startMoment.clone().add(i + 1, 'hours').toDate(),
          title: `meeting ${idx}`,
          location: `location ${idx}`,
          participants: [{name: `part ${idx}`, email: `part-${idx}@designit.com`} as Participant]
        });
      }
      resolve(res);
    });
  }
}
