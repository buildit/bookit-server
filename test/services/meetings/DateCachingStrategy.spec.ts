import * as moment from 'moment';
import {expect} from 'chai';

import {RootLog as logger} from '../../../src/utils/RootLogger';

import {Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import {StartDateCachingStrategy} from '../../../src/services/meetings/StartDateCachingStrategy';
import {EndDateCachingStrategy} from '../../../src/services/meetings/EndDateCachingStrategy';

const andrew = new Participant('andrew@orpiw.com');
const paul = new Participant('paul@orpiw.com');
const alex = new Participant('alex@orpiw.com');

const redRoom = {displayName: 'Red'};
const blueRoom = {displayName: 'Blue'};


describe('date caching suite', function startDateCachingSuite() {

  const first: Meeting = {
    id: '1',
    userMeetingId: '1',
    title: 'My first meeting',
    owner: andrew,
    location: blueRoom,
    participants: [],
    start: moment('2017-07-01 09:00:00'),
    end: moment('2017-07-02 09:30:00'),
  };

  const second: Meeting = {
    id: '2',
    userMeetingId: '2',
    title: 'My second meeting',
    owner: alex,
    location: redRoom,
    participants: [],
    start: moment('2017-07-02 10:00:00'),
    end: moment('2017-07-04 11:00:00'),
  };

  const third: Meeting = {
    id: '3',
    userMeetingId: '3',
    title: 'My third meeting',
    owner: paul,
    location: blueRoom,
    participants: [],
    start: moment('2017-07-03 14:00:00'),
    end: moment('2017-07-03 14:45:00'),
  };

  const fourth: Meeting = {
    id: '4',
    userMeetingId: '4',
    title: 'My fourth meeting',
    owner: alex,
    location: blueRoom,
    participants: [],
    start: moment('2017-07-02 17:00:00'),
    end: moment('2017-07-02 18:00:00'),
  };

  it('caches by start date', function testCachingByStartDate() {

    const cache = new Map<string, Map<string, Meeting>>();
    const startDateCacher = new StartDateCachingStrategy();

    [first, second, third, fourth].forEach(meeting => startDateCacher.put(cache, meeting));

    const july1 = startDateCacher.get(cache, '20170701');
    expect(july1.length).to.be.equal(1);
    const july1Set = new Set(july1.map(m => m.id));
    expect(july1Set.has('1')).to.be.true;

    const july2 = startDateCacher.get(cache, '20170702');
    expect(july2.length).to.be.equal(2);
    const july2Set = new Set(july2.map(m => m.id));
    expect(july2Set.has('2')).to.be.true;
    expect(july2Set.has('4')).to.be.true;

    const july3 = startDateCacher.get(cache, '20170703');
    expect(july3.length).to.be.equal(1);
    const july3Set = new Set(july3.map(m => m.id));
    expect(july3Set.has('3')).to.be.true;

  });

  it('evicts by start date', function testEvictionByStartDate() {

    const cache = new Map<string, Map<string, Meeting>>();
    const startDateCacher = new StartDateCachingStrategy();

    [first, second, third, fourth].forEach(meeting => startDateCacher.put(cache, meeting));

    expect(startDateCacher.get(cache, '20170701').length).to.be.equal(1);

    startDateCacher.remove(cache, first);
    expect(startDateCacher.get(cache, '20170701').length).to.be.equal(0);

    expect(startDateCacher.get(cache, '20170702').length).to.be.equal(2);

    startDateCacher.remove(cache, second);
    expect(startDateCacher.get(cache, '20170702').length).to.be.equal(1);

    startDateCacher.remove(cache, fourth);
    expect(startDateCacher.get(cache, '20170702').length).to.be.equal(0);

    expect(startDateCacher.get(cache, '20170703').length).to.be.equal(1);

    startDateCacher.remove(cache, third);
    expect(startDateCacher.get(cache, '20170703').length).to.be.equal(0);
  });

  it('caches by end date', function testCachingByStartDate() {

    const cache = new Map<string, Map<string, Meeting>>();
    const endDateCacher = new EndDateCachingStrategy();

    [first, second, third, fourth].forEach(meeting => endDateCacher.put(cache, meeting));


    const july2 = endDateCacher.get(cache, '20170702');
    expect(july2.length).to.be.equal(2);
    const july2Set = new Set(july2.map(m => m.id));
    expect(july2Set.has('1')).to.be.true;
    expect(july2Set.has('4')).to.be.true;

    const july3 = endDateCacher.get(cache, '20170703');
    expect(july3.length).to.be.equal(1);
    const july3Set = new Set(july3.map(m => m.id));
    expect(july3Set.has('3')).to.be.true;

    const july4 = endDateCacher.get(cache, '20170704');
    expect(july4.length).to.be.equal(1);
    const july4Set = new Set(july4.map(m => m.id));
    expect(july4Set.has('2')).to.be.true;

  });

  it('evicts by end date', function testEvictionByStartDate() {

    const cache = new Map<string, Map<string, Meeting>>();
    const endDateCacher = new EndDateCachingStrategy();

    [first, second, third, fourth].forEach(meeting => endDateCacher.put(cache, meeting));

    expect(endDateCacher.get(cache, '20170702').length).to.be.equal(2);

    endDateCacher.remove(cache, first);
    expect(endDateCacher.get(cache, '20170702').length).to.be.equal(1);

    endDateCacher.remove(cache, fourth);
    expect(endDateCacher.get(cache, '20170702').length).to.be.equal(0);


    expect(endDateCacher.get(cache, '20170703').length).to.be.equal(1);

    endDateCacher.remove(cache, third);
    expect(endDateCacher.get(cache, '20170703').length).to.be.equal(0);


    expect(endDateCacher.get(cache, '20170704').length).to.be.equal(1);

    endDateCacher.remove(cache, second);
    expect(endDateCacher.get(cache, '20170704').length).to.be.equal(0);
  });

});
