import {expect} from 'chai';
import * as moment from 'moment';
import {isMomentBetween} from '../../src/utils/validation';


describe('Validation', () => {

  const meetingsStart = moment('2016-03-12 13:00:00');
  const meetingsEnd = moment('2016-03-12 14:00:00');

  const enclosingStart = moment('2016-03-12 12:00:00');
  const enclosingEnd = moment('2016-03-12 15:00:00');

  const beforeStart = moment('2016-03-12 12:00:00');
  const beforeEnd = moment('2016-03-12 12:30:00');

  const afterStart = moment('2016-03-12 12:00:00');
  const afterEnd = moment('2016-03-12 12:30:00');

  it('enclosing meeting shows a conflict', () => {
    const isBetween = isMomentBetween(meetingsStart, meetingsEnd, enclosingStart, enclosingEnd);
    expect(isBetween).to.be.true;
  });

  it('before meeting shows no conflict', () => {
    const isBetween = isMomentBetween(meetingsStart, meetingsEnd, beforeStart, beforeEnd);
    expect(isBetween).to.be.false;
  });

  it('after meeting shows no conflict', () => {
    const isBetween = isMomentBetween(meetingsStart, meetingsEnd, afterStart, afterEnd);
    expect(isBetween).to.be.false;
  });

});
