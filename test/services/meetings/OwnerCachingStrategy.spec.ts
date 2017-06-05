import {expect} from 'chai';
import {filterOutMeetingById, filterOutMeetingByOwner, Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import * as moment from 'moment';
import {IdCachingStrategy} from '../../../src/services/meetings/IdCachingStrategy';
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

const first: Meeting = {
  id: '1',
  title: 'My first meeting',
  owner: andrew,
  participants: [],
  start: moment(),
  end: moment(),
};

const second: Meeting = {
  id: '2',
  title: 'My second meeting',
  owner: alex,
  participants: [],
  start: moment(),
  end: moment(),
};

const third: Meeting = {
  id: '3',
  title: 'My third meeting',
  owner: paul,
  participants: [],
  start: moment(),
  end: moment(),
};

const fourth: Meeting = {
  id: '4',
  title: 'My fourth meeting',
  owner: alex,
  participants: [],
  start: moment(),
  end: moment(),
};

describe('owner caching suite', function filterSuite() {
  it('caches by owner', function testFilterById() {

    const cache = new Map<string, Meeting[]>();
    const ownerCacher = new OwnerCachingStrategy();

    [first, second, third, fourth].forEach(meeting => ownerCacher.put(cache, meeting));

    const andrewList = ownerCacher.get(cache, 'andrew@wipro.com');
    expect(andrewList.length).to.be.equal(1);
    expect(andrewList[0].title).to.be.equal('My first meeting');

    const alexList = ownerCacher.get(cache, 'alex@wipro.com');
    expect(alexList.length).to.be.equal(2);
    expect(alexList[0].title).to.be.equal('My second meeting');
    expect(alexList[1].title).to.be.equal('My fourth meeting');

    const paulList = ownerCacher.get(cache, 'andrew@wipro.com');
    expect(paulList.length).to.be.equal(1);
    expect(paulList[0].title).to.be.equal('My first meeting');
  });

});
