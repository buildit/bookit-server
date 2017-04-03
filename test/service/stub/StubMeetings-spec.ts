import * as chai from 'chai';
import * as moment from 'moment';
import {Meeting} from '../../../src/model/Meeting';
import {StubMeetings} from '../../../src/service/stub/StubMeetings';
import DateTimeFormat = Intl.DateTimeFormat;

const expect = chai.expect;

describe('stub meetings', () => {
  it('should generate one meeting every four hours', () => {
    const meetings = new StubMeetings();
    let startMom = moment('2013-02-08 01');
    const start = startMom;
    const end = moment('2013-02-08 06');

    const meetingsExpected: Meeting[] = [
      {
        id: 'uuid-0',
        title: 'meeting 0',
        start: startMom.clone().toDate(),
        end: startMom.clone().add(1, 'hour').toDate(),
        location: 'location 0',
        participants: [{name: 'part 0', email: 'part-0@designit.com'}],
        owner: {name: 'owner 0', email: 'owner-0@designit.com'}
      },
      {
        id: 'uuid-1',
        title: 'meeting 1',
        start: startMom.clone().add(4, 'hours').toDate(),
        end: startMom.clone().add(5, 'hours').toDate(),
        location: 'location 1',
        participants: [{name: 'part 1', email: 'part-1@designit.com'}],
        owner: {name: 'owner 1', email: 'owner-1@designit.com'}
      }
    ];

    return meetings.getMeetings('test', start, end).then(list =>
      expect(list).to.deep.equal(meetingsExpected));
  });
});
