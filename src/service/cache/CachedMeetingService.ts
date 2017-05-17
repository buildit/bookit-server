import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {findById, Meeting} from '../../model/Meeting';
import {MeetingsService} from '../MeetingService';
import {Participant} from '../../model/Participant';
import {RootLog as logger} from '../../utils/RootLogger';
import {isMeetingWithinRange} from '../../utils/validation';
import {RoomService} from '../RoomService';

export class CachedMeetingService implements MeetingsService {
  private jobId: NodeJS.Timer;

  private calendarsCache: { [email: string]: Meeting[]; } = { };

  constructor(private delegatedMeetingsService: MeetingsService,
              private delegatedRoomService: RoomService) {
    logger.info('Constructing cached service');
    const cacheRefreshInterval = 10 * 1000;
    this.jobId = setInterval(() => {
      const start = moment().subtract(1, 'day'); // TODO: Set the cache range in config
      const end = moment().add(1, 'week');
      this.refreshCache(start, end);
    }, cacheRefreshInterval);
  }


  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      // logger.info('keys', Object.keys(this.calendarsCache));
      const meetings = this.calendarsCache[email] || [];
      // logger.info('Unfiltered', meetings);
      const filtered: Meeting[] =  meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));

      resolve(filtered);
    });
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createMeeting(subj, start, duration, owner, room)
               .then(meeting => {
                 const email = owner.email;
                 let meetings = this.calendarsCache[email];
                 if (!meetings || meetings.length <= 0) {
                   meetings = [];
                   this.calendarsCache[email] = meetings;
                 }

                 meetings.push(meeting);

                 return meeting;
               });
  }


  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const meeting = Object.keys(this.calendarsCache)
                            .reduce((acc: Meeting, email: string): Meeting => {
                              if (acc) {
                                return acc;
                              }

                              const meetings = this.calendarsCache[email];
                              return findById(meetings, meetingId);
                            }, undefined);

      meeting ? resolve(meeting) : reject('Unable to find meeting ' + meetingId);
    });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return this.delegatedMeetingsService.deleteMeeting(owner, id);
  }


  private cacheMeeting(meeting: Meeting) {

  }

  private refreshCache(start: Moment, end: Moment) {
    const meetingSvc = this.delegatedMeetingsService;
    const roomResponse = this.delegatedRoomService.getRooms('nyc');

    if (!roomResponse.found) {
      return;
    }

    roomResponse.rooms.forEach(room => {
      meetingSvc.getMeetings(room.email, start, end)
                .then(meetings => {
                  this.calendarsCache[room.email] = meetings;
                  return 'Cached meetings for ' + room.name;
                })
                .catch(error => ('Failed to cache meetings for:' + room.name));
    });
  }
}
