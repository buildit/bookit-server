import {expect} from 'chai';
import {filterOutMeetingById, filterOutMeetingByOwner, Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import * as moment from 'moment';
import {IdCachingStrategy} from '../../../src/services/meetings/IdCachingStrategy';

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
const karsten = new Participant('karsten@wipro.com');
const alex = new Participant('alex@wipro.com');

const redRoom = {displayName: 'Red'};

const first: Meeting = {
  id: '1',
  title: 'My first meeting',
  owner: andrew,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const second: Meeting = {
  id: '2',
  title: 'My second meeting',
  owner: andrew,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const third: Meeting = {
  id: '3',
  title: 'My third meeting',
  owner: karsten,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};


describe('id caching suite', function filterSuite() {
  it('caches by id', function testFilterById() {

    const cache = new Map<string, Meeting>();
    const idCacher = new IdCachingStrategy();

    idCacher.put(cache, first);
    const result = idCacher.get(cache, '1');

    expect(result).to.exist;
    expect(result.owner.email).to.be.equal(first.owner.email);
  });

});
