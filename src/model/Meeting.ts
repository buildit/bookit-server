import {Participant} from './Participant';
import * as moment from 'moment';

export class Meeting {
  id: string;
  title: string;
  location?: string;
  owner: Participant;
  participants: Participant[];
  start: moment.Moment;
  end: moment.Moment;
}


export function findById(meetings: Meeting[], id: string) {
  return meetings.find(meeting => meeting.id === id);
}


export function addMeetingById(meetings: Meeting[], toAdd: Meeting) {
  console.log('adding by id', toAdd.id, meetings);
  const found = meetings.some(meeting => { return matchMeetingById(meeting, toAdd); });
  console.log('adding?', found, toAdd.id);
  if (!found) {
    meetings.push(toAdd);
    console.log('added by id', toAdd.id);
    return meetings;
  }
  console.log('already present', toAdd.id);
}


export function filterOutMeetingById(meetings: Meeting[], toFilter: Meeting) {
  return filterOutMeetingsBy(meetings, toFilter, matchMeetingById);
}


export function filterOutMeetingByOwner(meetings: Meeting[], toFilter: Meeting) {
  return filterOutMeetingsBy(meetings, toFilter, matchMeetingByOwner);
}


function filterMeetingsBy(meetings: Meeting[], filter: Meeting, matcher: (some: Meeting, other: Meeting) => boolean) {
  return meetings.filter(meeting => !matcher(meeting, filter));
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
