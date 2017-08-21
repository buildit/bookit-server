import {expect} from 'chai';
import * as moment from 'moment';
import {matchMeeting} from '../../../src/rest/meetings/meeting_functions';
import {Meeting} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';

describe('Meetings matcher', function meetingsMatcherSuite() {
  const phil = new Participant('willofphil@peel.com', 'Phil');

  const start1 = moment();
  const end1 = start1.clone().add(10, 'minutes');

  const start2 = moment().add(1, 'week');
  const end2 = start2.clone().add(10, 'minutes');

  const meetingInTheList: Meeting = {
    id: '1',
    userMeetingId: '1',
    title: 'Lunchtime',
    location: { displayName: 'NYC'},
    owner: phil,
    participants: [phil],
    start: start1,
    end: end1,
  };

  const meetingNotInTheList = {
    id: '2',
    userMeetingId: '2',
    title: 'Naptime',
    location: { displayName: 'NYC'},
    owner: phil,
    participants: [phil],
    start: start2,
    end: end2,
  };

  const meetingList = [
    {
      id: '3', // Different id, but same meeting! Damn you, Microsoft!
      userMeetingId: '3',
      title: 'Cant see title, because it is obscured by MS API',
      location: { displayName: 'NYC'},
      owner: phil,
      participants: [phil],
      start: start1,
      end: end1,
    },
    {
      id: '4',
      userMeetingId: '4',
      title: 'Dumbtime',
      location: { displayName: 'NYC'},
      owner: phil,
      participants: [phil],
      start: start1.clone().add(1, 'hour'),
      end: end1.clone().add(1.5, 'hour'),
    },
    {
      id: '5',
      userMeetingId: '5',
      title: 'Flickertime',
      location: { displayName: 'NYC'},
      owner: phil,
      participants: [phil],
      start: start1.clone().add(2, 'hour'),
      end: end1.clone().add(2.5, 'hour'),
    },
  ];

  it('finds a meeting that exists in the list, even if they have different ids and titles, because Microsuck.', function testFindExistingMeeting() {
    const result = matchMeeting(meetingInTheList, meetingList);

    expect(result.start).to.deep.equal(meetingInTheList.start);
    expect(result.end).to.deep.equal(meetingInTheList.end);
    expect(result.owner).to.deep.equal(meetingInTheList.owner);

    expect(result.id).to.not.equal(meetingInTheList.id);
    expect(result.title).to.not.equal(meetingInTheList.title);
  });

  it('returns undefined for a meeting that does not exist in the list', function testFindNonexistantMeeting() {
    const result = matchMeeting(meetingNotInTheList, meetingList);
    expect(result).to.be.undefined;
  });
});
