import {expect} from 'chai';
import {Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import * as moment from 'moment';
import {ParticipantsCachingStrategy} from '../../../src/services/meetings/ParticipantsCachingStrategy';


const andrew = new Participant('andrew@wipro.com');
const paul = new Participant('paul@wipro.com');
const alex = new Participant('alex@wipro.com');
const zac = new Participant('zac@wipro.com');

const first: Meeting = {
  id: '1',
  title: 'My first meeting',
  owner: andrew,
  participants: [paul],
  start: moment(),
  end: moment(),
};

const second: Meeting = {
  id: '2',
  title: 'My second meeting',
  owner: alex,
  participants: [andrew],
  start: moment(),
  end: moment(),
};

const third: Meeting = {
  id: '3',
  title: 'My third meeting',
  owner: paul,
  participants: [alex],
  start: moment(),
  end: moment(),
};

const fourth: Meeting = {
  id: '4',
  title: 'My fourth meeting',
  owner: alex,
  participants: [andrew, paul],
  start: moment(),
  end: moment(),
};

const fifth: Meeting = {
  id: '5',
  title: 'Owner as participant',
  owner: zac,
  participants: [andrew],
  start: moment(),
  end: moment(),
};


describe('participant caching suite', function filterSuite() {

  it('caches by participant strategy properly', function testParticipantCaching() {
    const cache = new Map<string, Meeting[]>();
    const participantCacher = new ParticipantsCachingStrategy();

    [first, second, third, fourth, fifth].forEach(meeting => participantCacher.put(cache, meeting));

    const andrewList = participantCacher.get(cache, 'andrew@wipro.com');
    expect(andrewList.length).to.be.equal(4);
    const andrewSet = new Set(andrewList.map(m => m.id));
    expect(andrewSet.has('1')).to.be.true;
    expect(andrewSet.has('2')).to.be.true;
    expect(andrewSet.has('4')).to.be.true;
    expect(andrewSet.has('5')).to.be.true;

    const alexList = participantCacher.get(cache, 'alex@wipro.com');
    expect(alexList.length).to.be.equal(3);
    const alexSet = new Set(alexList.map(m => m.id));
    expect(alexSet.has('2')).to.be.true;
    expect(alexSet.has('3')).to.be.true;
    expect(alexSet.has('4')).to.be.true;

    const paulList = participantCacher.get(cache, 'paul@wipro.com');
    expect(paulList.length).to.be.equal(3);
    const paulSet = new Set(paulList.map(m => m.id));
    expect(paulSet.has('1')).to.be.true;
    expect(paulSet.has('3')).to.be.true;
    expect(paulSet.has('4')).to.be.true;

    const zacList = participantCacher.get(cache, 'zac@wipro.com');
    expect(zacList.length).to.be.equal(1);
    expect(zacList[0].id).to.be.equal('5');
  });

  it('un-caches by participant strategy properly', function testParticipantCaching() {
    function mapToSet(meetings: Meeting[]) {
      return new Set(meetings.map(m => m.id));
    }

    const cache = new Map<string, Meeting[]>();
    const participantCacher = new ParticipantsCachingStrategy();

    [first, second, third, fourth, fifth].forEach(meeting => participantCacher.put(cache, meeting));

    participantCacher.remove(cache, first);

    expect(mapToSet(participantCacher.get(cache, 'andrew@wipro.com')).has('1')).to.be.false;
    expect(mapToSet(participantCacher.get(cache, 'paul@wipro.com')).has('1')).to.be.false;

    participantCacher.remove(cache, second);

    expect(mapToSet(participantCacher.get(cache, 'andrew@wipro.com')).has('2')).to.be.false;
    expect(mapToSet(participantCacher.get(cache, 'alex@wipro.com')).has('2')).to.be.false;

    participantCacher.remove(cache, third);
    expect(mapToSet(participantCacher.get(cache, 'alex@wipro.com')).has('3')).to.be.false;
    expect(mapToSet(participantCacher.get(cache, 'paul@wipro.com')).has('3')).to.be.false;

    participantCacher.remove(cache, fourth);
    expect(mapToSet(participantCacher.get(cache, 'alex@wipro.com')).has('4')).to.be.false;
    expect(mapToSet(participantCacher.get(cache, 'paul@wipro.com')).has('4')).to.be.false;
    expect(mapToSet(participantCacher.get(cache, 'andrew@wipro.com')).has('4')).to.be.false;

    participantCacher.remove(cache, fifth);
    expect(mapToSet(participantCacher.get(cache, 'andrew@wipro.com')).has('5')).to.be.false;
    expect(mapToSet(participantCacher.get(cache, 'zac@wipro.com')).has('5')).to.be.false;
  });

});
