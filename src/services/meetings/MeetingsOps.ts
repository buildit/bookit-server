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

  return new Promise((resolve, reject) => {
    const ifAvailable = checkTimeIsAvailable(meetingService, room, start, duration);

    ifAvailable.then(() => meetingService.createUserMeeting(subj, start, duration, owner, room)
                                         .then(resolve)
                                         .catch(reject))
               .catch(reject);
  });
}

export function updateMeetingOperation(meetingService: MeetingsService,
                                       userMeetingId: string,
                                       subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room): Promise<Meeting> {
    const end = start.clone().add(duration);

    return handleRoomMeetingFetch(meetingService, room, owner, start, end)
      .then(roomMeetings => checkMeetingTimeIsAvailable(roomMeetings.meetings, userMeetingId, start, duration))
      .then(() => meetingService.updateUserMeeting(userMeetingId, subj, start, duration, owner, room));
}


export interface RoomMeetings {
  room: Room;
  meetings: Meeting[];
}
