import {Meetings} from '../../src/service/Meetings';
import {MeetingHelper} from '../../src/utils/data/MeetingHelper';
import * as moment from 'moment';
import {expect} from 'chai';
import {Participant} from '../../src/model/Participant';

export default function StatefulSpec(svc: Meetings, description: string) {
  description = description || '???';

  const ROMAN_ID = 'romans@myews.onmicrosoft.com';
  const nonExistentRoomId = 'find a library to create unique id';
  const existingRoomId = 'cyan-room@myews.onmicrosoft.com';
  const helper = MeetingHelper.calendarOf(ROMAN_ID, svc);

  const start = moment().add(20 + Math.random() * 20, 'days').startOf('day');
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
        return retry(action, check);
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

  describe(description, () => {

    before(() => {
      return cleanup();
    });

    it('returns a list of meetings for the room (room auto accepts!)',
      setup(() => {
        return helper.createEvent(subject, start.clone().add(1, 'minute'), moment.duration(1, 'minute'), [{
          name: 'Joe',
          email: existingRoomId
        }]);
      }).test(() => {

        return retry(() => svc.getMeetings(existingRoomId, start, end), val => val.length > 0).then(meetings => {
          expect(meetings.length).to.be.eq(1);
          expect(meetings[0].title).to.be.eq(subject);
          expect(meetings[0].owner.email).to.be.eq(ROMAN_ID);
          expect(meetings[0].participants.map((p: Participant) => p.email)).to.be
            .deep.eq([ROMAN_ID, existingRoomId]);
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
}
