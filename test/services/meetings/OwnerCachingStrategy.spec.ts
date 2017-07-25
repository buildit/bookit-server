import * as moment from 'moment';
import {expect} from 'chai';

import {Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import {OwnerCachingStrategy} from '../../../src/services/meetings/OwnerCachingStrategy';

/*
 export class Meeting {
 id: string;
 title: string;
 location?: string;
 owner: Participant;
 participants: Participant[];
 start: moment.Moment;
 end: moment.Moment;
 }

 */

const andrew = new Participant('andrew@wipro.com');
const paul = new Participant('paul@wipro.com');
const alex = new Participant('alex@wipro.com');

const redRoom = {displayName: 'Red'};

const andrewFirst: Meeting = {
  id: '1',
  userMeetingId: '1',
  title: 'My first meeting',
  owner: andrew,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const alexFirst: Meeting = {
  id: '2',
  userMeetingId: '2',
  title: 'My second meeting',
  owner: alex,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const paulFirst: Meeting = {
  id: '3',
  userMeetingId: '3',
  title: 'My third meeting',
  owner: paul,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const alexSecond: Meeting = {
  id: '4',
  userMeetingId: '2',
  title: 'My fourth meeting',
  owner: alex,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};


describe('owner caching suite', function filterSuite() {
  it('caches by owner', function testCacheByOwner() {

    const cache = new Map<string, Map<string, Meeting>>();
    const ownerCacher = new OwnerCachingStrategy();

    [andrewFirst, alexFirst, paulFirst, alexSecond].forEach(meeting => ownerCacher.put(cache, meeting));

    const andrewList = ownerCacher.get(cache, 'andrew@wipro.com');
    expect(andrewList.length).to.be.equal(1);
    expect(andrewList[0].title).to.be.equal('My first meeting');

    const alexList = ownerCacher.get(cache, 'alex@wipro.com');
    expect(alexList.length).to.be.equal(2);
    expect(alexList[0].title).to.be.equal('My second meeting');
    expect(alexList[1].title).to.be.equal('My fourth meeting');

    const paulList = ownerCacher.get(cache, 'paul@wipro.com');
    expect(paulList.length).to.be.equal(1);
    expect(paulList[0].title).to.be.equal('My third meeting');
  });


  it('un-caches by owner', function testUnCacheByOwner() {

    const cache = new Map<string, Map<string, Meeting>>();
    const ownerCacher = new OwnerCachingStrategy();

    [andrewFirst, alexFirst, paulFirst, alexSecond].forEach(meeting => ownerCacher.put(cache, meeting));

    ownerCacher.remove(cache, andrewFirst);

    expect(ownerCacher.get(cache, 'andrew@wipro.com').length).to.be.equal(0);

    ownerCacher.remove(cache, alexFirst);
    expect(ownerCacher.get(cache, 'alex@wipro.com').length).to.be.equal(1);

    ownerCacher.remove(cache, alexSecond);
    expect(ownerCacher.get(cache, 'alex@wipro.com').length).to.be.equal(0);

    ownerCacher.remove(cache, paulFirst);
    expect(ownerCacher.get(cache, 'paul@wipro.com').length).to.be.equal(0);
  });

});
