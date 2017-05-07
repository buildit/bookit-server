import {Meeting} from '../../model/Meeting';
import {MeetingsService} from '../MeetingService';
import {Participant} from '../../model/Participant';
import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {LocalRooms} from '../local/LocalRooms';
import {AppConfig} from '../../config/config';
import {RootLog as logger} from '../../utils/RootLogger';

export class CachedMeetings implements MeetingsService {

  private jobId: NodeJS.Timer;

  private calendarsCache: { [email: string]: Meeting[]; } = { };

  constructor(private delegatedMeetingsService: MeetingsService) {
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
        .filter(meeting => (
          moment(meeting.start).isAfter(start) &&
          moment(meeting.start).isBefore(end)
        )) : [];

      logger.debug('Getting cached meetings for:', email);
      logger.debug(`${meetings.length} cached meetings retrieved for ${email}`);

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
    const roomSvc = new LocalRooms(AppConfig.roomLists); // TODO: Use delegated room service.
    const meetingSvc = this.delegatedMeetingsService;
    const roomResponse = roomSvc.getRooms('nyc');

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
