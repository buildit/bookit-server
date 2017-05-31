import * as moment from 'moment';
import {expect} from 'chai';
import {Participant} from '../../src/model/Participant';
import {MeetingsOps} from '../../src/services/MeetingsOps';
import {Moment} from 'moment';

describe('Meeting ops validation', () => {

  const meetingsStart = moment('2016-03-12 13:00:00');
  const meetingsEnd = moment('2016-03-12 14:00:00');

  const enclosingStart = moment('2016-03-12 12:00:00');
  const enclosingEnd = moment('2016-03-12 15:00:00');

  const beforeStart = moment('2016-03-12 12:00:00');
  const beforeEnd = moment('2016-03-12 12:30:00');

  const afterStart = moment('2016-03-12 12:00:00');
  const afterEnd = moment('2016-03-12 12:30:00');

  it('enclosing meeting shows a conflict', () => {
  });

  it('before meeting shows no conflict', () => {
  });

  it('after meeting shows no conflict', () => {
  });

});
