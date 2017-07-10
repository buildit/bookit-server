import {expect} from 'chai';
import * as moment from 'moment';
import {isMeetingOverlapping} from '../../src/utils/validation';


describe('Validation', function testValidationSuite() {
  const dateStart = new Date('2016-03-12 13:00:00');
  const dateEnd = new Date('2016-03-12 14:00:00');

  const meetingsStart = moment(dateStart);
  const meetingsEnd = moment(dateEnd);

  const enclosingStart = moment('2016-03-12 12:00:00');
  const enclosingEnd = moment('2016-03-12 15:00:00');

  const beforeStart = moment('2016-03-12 12:00:00');
  const beforeEnd = moment('2016-03-12 12:30:00');

  const afterStart = moment('2016-03-12 12:00:00');
  const afterEnd = moment('2016-03-12 12:30:00');

  const overlapBeforeStart = moment('2016-03-12 12:30:00');
  const overlapBeforeEnd = moment('2016-03-12 13:30:00');

  const overlapAfterStart = moment('2016-03-12 13:30:00');
  const overlapAfterEnd = moment('2016-03-12 14:30:00');


  it('enclosing meeting shows a conflict', function testEnclosedMeeting() {
    const isBetween = isMeetingOverlapping(meetingsStart, meetingsEnd, enclosingStart, enclosingEnd);
    expect(isBetween).to.be.true;
  });

  it('overlapping meeting before shows a conflict', function testOverlapBefore() {
    const isBetween = isMeetingOverlapping(meetingsStart, meetingsEnd, overlapBeforeStart, overlapBeforeEnd);
    expect(isBetween).to.be.true;
  });

  it('overlapping meeting after shows a conflict', function testOverlapAfter() {
    const isBetween = isMeetingOverlapping(meetingsStart, meetingsEnd, overlapAfterStart, overlapAfterEnd);
    expect(isBetween).to.be.true;
  });

  it('before meeting shows no conflict', function testBeforeNoOverlap() {
    const isBetween = isMeetingOverlapping(meetingsStart, meetingsEnd, beforeStart, beforeEnd);
    expect(isBetween).to.be.false;
  });

  it('after meeting shows no conflict', function testAfterNoOverlap() {
    const isBetween = isMeetingOverlapping(meetingsStart, meetingsEnd, afterStart, afterEnd);
    expect(isBetween).to.be.false;
  });

});
