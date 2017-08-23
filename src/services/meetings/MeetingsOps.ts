import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../../model/Meeting';
import {isMeetingOverlapping} from '../../utils/validation';
import {UserService} from '../users/UserService';


function hasAnyMeetingConflicts(meetings: Meeting[], newMeetingStart: moment.Moment, newMeetingEnd: moment.Moment) {
  logger.info('Checking overlap', newMeetingStart, newMeetingEnd, meetings);
  const conflict = meetings.find(meeting => {
    return isMeetingOverlapping(moment(meeting.start), moment(meeting.end), newMeetingStart, newMeetingEnd);
  });

  if (conflict) {
    throw 'Found conflict';
  }
}


function hasConflicts(meetings: Meeting[], originalId: string, start: Moment, end: Moment): boolean {
  const conflict = meetings.find(meeting => {
    logger.info(`Checking conflict: ${meeting.id} against ${originalId}`);
    return meeting.id !== originalId && isMeetingOverlapping(meeting.start, meeting.end, start, end);
  });

  if (conflict) {
    throw 'Found other meeting conflict';
  }

  return false;
}


export function checkTimeIsAvailable(meetingsService: MeetingsService,
                                     room: Room,
                                     start: moment.Moment,
                                     duration: moment.Duration): Promise<any> {
  /*
  Expand the query window to actually return meetings that can potentially overlap.  This may not be sufficient in case
  of ridiculously long meetings (e.g. longer than a day from the prior day)
   */
  const startQuery = start.clone().startOf('day');
  const endQuery = start.clone().add(duration).add(1, 'day');


  const end = start.clone().add(duration);
  return meetingsService.getMeetings(room, startQuery, endQuery)
                        .then(meetings => hasAnyMeetingConflicts(meetings, start, end));
}


export function checkMeetingTimeIsAvailable(meetings: Meeting[],
                                     userMeetingId: string,
                                     start: Moment,
                                     duration: Duration) {
  const end = start.clone().add(duration);
  return hasConflicts(meetings, userMeetingId, start, end);
}


export function createMeetingOperation(meetingService: MeetingsService,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room): Promise<Meeting> {
  const maybeAvailable = checkTimeIsAvailable(meetingService, room, moment.utc(start), duration);
  return maybeAvailable.then(() => meetingService.createUserMeeting(subj, start, duration, owner, room));
}


export function checkUserIsAdmin(userService: UserService, updater: Participant) {
  /*
   If the updater is the owner, the meeting will be found.  Otherwise, it's not the owner and we should check
   if the updater is an admin
  */
  if (!userService.isUserAnAdmin(updater.email)) {
    throw new Error(`${updater.name} is not the owner of this meeting and is not an admin`);
  }

}


/*
TODO: this should no be here
 */
export interface RoomMeetings {
  room: Room;
  meetings: Meeting[];
}
