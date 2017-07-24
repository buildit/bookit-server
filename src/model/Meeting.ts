import {Participant} from './Participant';
import * as moment from 'moment';

export class Location {
  displayName: string;
  address?: any;
}

export class Meeting {
  id: string;
  userMeetingId: string;
  title: string;
  location: Location;
  owner: Participant;
  participants: Participant[];
  start: moment.Moment;
  end: moment.Moment;
}


export function findById(meetings: Meeting[], id: string) {
  return meetings.find(meeting => meeting.id === id);
}


export function filterOutMeetingById(meetings: Meeting[], toFilter: Meeting) {
  return filterOutMeetingsBy(meetings, toFilter, matchMeetingById);
}


export function filterOutMeetingByOwner(meetings: Meeting[], toFilter: Meeting) {
  return filterOutMeetingsBy(meetings, toFilter, matchMeetingByOwner);
}


function filterOutMeetingsBy(meetings: Meeting[], filter: Meeting, matcher: (some: Meeting, other: Meeting) => boolean) {
  return meetings.filter(meeting => !matcher(meeting, filter));
}


function matchMeetingById(some: Meeting, other: Meeting) {
  return some.id === other.id;
}


function matchMeetingByOwner(some: Meeting, other: Meeting) {
  return some.owner.email === other.owner.email;
}
