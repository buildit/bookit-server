import {expect} from 'chai';
import {AppConfig} from '../../../src/config/config';
import {CloudMeetings} from '../../../src/service/cloud/CloudMeetings';
import {MeetingHelper} from '../../../src/utils/data/MeetingHelper';
import moment = require('moment');

const svc = new CloudMeetings(AppConfig.graphApi);
const ROMAN_ID = 'romans@myews.onmicrosoft.com';
const nonExistentRoomId = 'find a library to create unique id';
const helper = MeetingHelper.calendarOf(ROMAN_ID);

const start = moment().add(100, 'days');
const end = start.clone().add(1, 'day');
const subject = 'helper made!!';

// create an event
function cleanup(): Promise<any> {
  return helper.cleanupMeetings(start, end);
};

function setup(action: any): BeforeAfter {
  return new BeforeAfter(action);
}

function retry(action: () => Promise<any>, check: (val: any) => boolean): Promise<any> {
  return action().then(val => {
    if (!check(val)) {
      return action();
    } else {
      return val;
    }
  });
}

// todo mocha?
class BeforeAfter {
  constructor(private setup: any) {
  }

  test(steps: any): any {
    const up = this.setup() as Promise<any>;
    const then = up.then(steps);
    return () => then;
  }
}

describe('Cloud Meetings service', () => {

  before(() => {
    return cleanup();
  });

  it('returns a list of meetings',
    setup(() => {
      return helper.createEvent(subject, start.clone().add(1, 'minute'), moment.duration(1, 'minute'), [{
        name: 'Joe',
        email: 'joe@nowhere'
      }]);
    }).test(() => {

      return retry(() => svc.getMeetings(ROMAN_ID, start, end), val => val.length === 1).then(meetings => {
        expect(meetings.length).to.be.eq(1);
        expect(meetings[0].title).to.be.eq(subject);
        expect(meetings[0].participants).to.be.deep.eq([{name: 'Joe', email: 'joe@nowhere'}]);
      });
    }));

  it('correctly handles no meetings', () => {
    return svc.getMeetings(ROMAN_ID, start, end).then(meetings => {
      expect(meetings.length).to.be.eq(0);
    });
  });

  it('returns an empty array for non-existent room', () => {
    return svc.getMeetings(nonExistentRoomId, start, end).then(meetings => {
      expect(meetings.length).to.be.eq(0);
    });
  });

  afterEach(() => {
    return cleanup();
  });

});

