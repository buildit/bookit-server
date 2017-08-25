import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {Participant} from '../../model/Participant';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {Meeting} from '../../model/Meeting';
import {isMeetingOverlapping} from '../../utils/validation';
import {UserService} from '../users/UserService';


function hasAnyMeetingConflicts(meetings: Meeting[], meetingStart: moment.Moment, meetingEnd: moment.Moment) {
  return meetings.find(meeting => {
    logger.debug(`hasAnyMeetingConflicts() - checking conflict against ${meetingStart} ${meetingEnd}`, meeting);
    return isMeetingOverlapping(meeting.start, meeting.end, meetingStart, meetingEnd);
  });
}


export function hasUserMeetingConflicts(meetings: Meeting[],
                                        originalId: string,
                                        meetingStart: Moment,
                                        meetingEnd: Moment) {
  return meetings.find(meeting => {
    logger.debug(`Checking conflict: ${meeting.id} against ${originalId}`);
    return meeting.id !== originalId && isMeetingOverlapping(meeting.start, meeting.end, meetingStart, meetingEnd);
  });
}


export function checkAnyMeetingTimeIsAvailable(meetingsService: MeetingsService,
                                               room: Room,
                                               start: moment.Moment,
                                               end: Moment): Promise<Meeting[]> {
  return meetingsService.getMeetings(room, start, end)
                        .then(meetings => {
                          if (hasAnyMeetingConflicts(meetings, start, end)) {
                            return Promise.reject('Conflict found');
                          }

                          return Promise.resolve(meetings);
                        });
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
