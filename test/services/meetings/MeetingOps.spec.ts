import {expect} from 'chai';
import {filterOutMeetingById, filterOutMeetingByOwner, Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import * as moment from 'moment';

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

const redRoom = {displayName: 'Red'};

const andrew = new Participant('andrew@orpiw.com');
const karsten = new Participant('karsten@orpiw.com');

const first: Meeting = {
  id: '1',
  userMeetingId: '1',
  title: 'My first meeting',
  owner: andrew,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const second: Meeting = {
  id: '2',
  userMeetingId: '2',
  title: 'My second meeting',
  owner: andrew,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};

const third: Meeting = {
  id: '3',
  userMeetingId: '3',
  title: 'My third meeting',
  owner: karsten,
  location: redRoom,
  participants: [],
  start: moment(),
  end: moment(),
};


describe('meeting filtering suite', function filterSuite() {
  it('filters out meetings by id', function testFilterById() {

    const meetings = [first, second];
    const filteredMeetings = filterOutMeetingById(meetings, first);

    expect(filteredMeetings.length).to.be.lessThan(meetings.length);
    expect(filteredMeetings[0].id).to.be.equal(second.id);
  });

  it('filters out meetings by participant', function testFilterByParticipant() {
    const meetings = [first, second, third];
    const filteredMeetings = filterOutMeetingByOwner(meetings, first);

    expect(filteredMeetings.length).to.be.lessThan(meetings.length);
    expect(filteredMeetings[0].id).to.be.equal(third.id);
  });
});
