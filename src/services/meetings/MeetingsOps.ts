import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../../model/Meeting';
import {isMeetingOverlapping} from '../../utils/validation';
import {handleMeetingFetch, handleRoomMeetingFetch} from '../../rest/meetings/meeting_functions';
import {Credentials} from '../../model/Credentials';
import {UserService} from '../users/UserService';


function hasAnyMeetingConflicts(meetings: Meeting[], newMeetingStart: moment.Moment, newMeetingEnd: moment.Moment) {
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


function checkTimeIsAvailable(meetingsService: MeetingsService,
                              room: Room,
                              start: moment.Moment,
                              duration: moment.Duration): Promise<any> {
  const end = start.clone().add(duration);

  return meetingsService.getMeetings(room, start, end)
                        .then(meetings => hasAnyMeetingConflicts(meetings, start, end));
}


function checkMeetingTimeIsAvailable(meetings: Meeting[],
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

    return checkTimeIsAvailable(meetingService, room, start, duration)
      .then(() => meetingService.createUserMeeting(subj, start, duration, owner, room));
}


export function updateMeetingOperation(userService: UserService,
                                       meetingService: MeetingsService,
                                       userMeetingId: string,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       updater: Participant,
                                       room: Room): Promise<Meeting> {
    const end = start.clone().add(duration);

    return handleRoomMeetingFetch(meetingService, room, updater, start, end)
      .then(roomMeetings => checkMeetingTimeIsAvailable(roomMeetings.meetings, userMeetingId, start, duration))
      .then(() => meetingService.getUserMeeting(updater, userMeetingId))
      .catch(() => checkUserIsAdmin(userService, updater))
      .then(() => meetingService.updateUserMeeting(userMeetingId, subj, start, duration, updater, room));
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
