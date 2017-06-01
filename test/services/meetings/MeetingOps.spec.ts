import {expect} from 'chai';
import {Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import * as moment from 'moment';
import {filterOutMeetingById, filterOutMeetingByOwner} from '../../../src/services/meetings/MeetingsOps';

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
  owner: andrew,
  participants: [],
  start: moment(),
  end: moment(),
};

const third: Meeting = {
  id: '3',
  title: 'My third meeting',
  owner: karsten,
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
