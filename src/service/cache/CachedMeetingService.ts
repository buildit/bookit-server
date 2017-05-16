import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {Meeting} from '../../model/Meeting';
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
      const meetings: Meeting[] = this.calendarsCache[email] ? this.calendarsCache[email]
        .filter(meeting => isMeetingWithinRange(meeting, start, end)) : [];

      resolve(meetings);
    });
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    return this.delegatedMeetingsService.createMeeting(subj, start, duration, owner, room);
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return this.delegatedMeetingsService.deleteMeeting(owner, id);
  }


  refreshCache(start: Moment, end: Moment) {
    const meetingSvc = this.delegatedMeetingsService;
    const roomResponse = this.delegatedRoomService.getRooms('nyc');

    return new Promise((resolve, reject) => {
      if (!roomResponse.found) {
        reject('No roomResponse!');
      } else {
        Promise.all(roomResponse.rooms.map(room => {
          return meetingSvc.getMeetings(room.email, start, end)
            .then(meetings => {
              this.calendarsCache[room.email] = meetings;
              return 'Cached meetings for ' + room.name;
            })
            .catch(error => ('Failed to cache meetings for:' + room.name));
        }))
          .then(result => result)
          .catch(error => {
            logger.error(error);
            return error;
          });
      }
    });
  }
}
