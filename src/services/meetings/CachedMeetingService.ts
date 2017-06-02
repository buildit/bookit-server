import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {findById, Meeting} from '../../model/Meeting';
import {MeetingsService} from './MeetingService';
import {Participant} from '../../model/Participant';
import {RootLog as logger} from '../../utils/RootLogger';
import {isMeetingWithinRange} from '../../utils/validation';
import {RoomService} from '../rooms/RoomService';
import {IdCachingStrategy} from '../cache/IdCachingStrategy';
// import {ParticipantCachingStrategy} from '../cache/ParticipantCachingStrategy';
import {OwnerCachingStrategy} from '../cache/OwnerCachingStrategy';


const DEFAULT_REFRESH = 10 * 1000;

const ID_CACHE_STRATEGY = new IdCachingStrategy();
// const PARTICIPANT_CACHE_STRATEGY = new ParticipantCachingStrategy();
const OWNER_CACHE_STRATEGY = new OwnerCachingStrategy();


export class CachedMeetingService implements MeetingsService {


  private jobId: NodeJS.Timer;


  private idCache = new Map<string, Meeting>();


  private ownerCache = new Map<string, Meeting[]>();


  private participantCache = new Map<string, Meeting[]>();


  constructor(private delegatedMeetingsService: MeetingsService,
              private delegatedRoomService: RoomService) {

    const _internalRefresh = () => {
      console.log('Refreshing now...');
      const start = moment().subtract(1, 'day'); // TODO: Set the cache range in config
      const end = moment().add(1, 'week');
      this.refreshCache(start, end);
    };

    logger.info('Constructing cached services');
    _internalRefresh();
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH);

  }


  getMeetings(owner: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const meetings = OWNER_CACHE_STRATEGY.get(this.ownerCache, owner) || [];
      const filtered =  meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));

      resolve(filtered);
    });
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createMeeting(subj, start, duration, owner, room)
               .then(meeting => {
                 this.cacheMeeting(meeting);

                 return meeting;
               });
  }


  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const meeting = this.idCache.get(meetingId);
      meeting ? resolve(meeting) : reject('Unable to find meeting ' + meetingId);
    });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return this.delegatedMeetingsService.deleteMeeting(owner, id);
  }


  private refreshCache(start: Moment, end: Moment) {
    const meetingSvc = this.delegatedMeetingsService;
    const roomResponse = this.delegatedRoomService.getRooms('nyc');

    if (!roomResponse.found) {
      return;
    }

    roomResponse.rooms.forEach(room => {
      meetingSvc.getMeetings(room.email, start, end)
                .then(meetings => meetings.forEach(this.cacheMeeting.bind(this)))
                .catch(error => ('Failed to cache meetings for:' + room.name));
    });
  }


  private cacheMeeting(meeting: Meeting) {
    console.log('Cached meeting for ' + meeting.id);
    ID_CACHE_STRATEGY.put(this.idCache, meeting);
    console.log('2Cached meeting for ' + meeting.id);
    OWNER_CACHE_STRATEGY.put(this.ownerCache, meeting);
    console.log('3Cached meeting for ' + meeting.id);
    // PARTICIPANT_CACHE_STRATEGY.put(this.participantCache, meeting);
    // console.log('4Cached meeting for ' + meeting.id);
    return meeting;
  }
}
