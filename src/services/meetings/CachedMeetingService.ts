import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {Meeting} from '../../model/Meeting';
import {MeetingsService} from './MeetingService';
import {Participant} from '../../model/Participant';
import {RootLog as logger} from '../../utils/RootLogger';
import {isMeetingWithinRange} from '../../utils/validation';
import {RoomService} from '../rooms/RoomService';
import {IdCachingStrategy} from './IdCachingStrategy';
import {ParticipantsCachingStrategy} from './ParticipantsCachingStrategy';
import {OwnerCachingStrategy} from './OwnerCachingStrategy';
import {RoomCachingStrategy} from './RoomCachingStrategy';
import {Room} from '../../model/Room';
import {Domain} from '../../model/EnvironmentConfig';


const DEFAULT_REFRESH = 1200 * 1000;
// const DEFAULT_REFRESH = 5 * 1000;

const ID_CACHE_STRATEGY = new IdCachingStrategy();
const PARTICIPANTS_CACHE_STRATEGY = new ParticipantsCachingStrategy();
const OWNER_CACHE_STRATEGY = new OwnerCachingStrategy();
const ROOM_CACHE_STRATEGY = new RoomCachingStrategy();


export class CachedMeetingService implements MeetingsService {

  private fetched: boolean;


  private jobId: NodeJS.Timer;


  private idCache = new Map<string, Meeting>();


  private ownerCache = new Map<string, Meeting[]>();


  private roomCache = new Map<string, Meeting[]>();


  private participantCache = new Map<string, Meeting[]>();


  constructor(private _domain: Domain,
              private roomService: RoomService,
              private delegatedMeetingsService?: MeetingsService) {

    const _internalRefresh = () => {
      this.refreshCache();
    };

    if (!delegatedMeetingsService) {
      this.delegatedMeetingsService = new PassThroughMeetingService(_domain.domainName);
    }

    logger.info('Constructing CachedMeetingService');
    _internalRefresh();
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH);

  }


  domain() {
    return this.delegatedMeetingsService.domain();
  }


  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    logger.info('Fetched?:', this.fetched);
    const fetchMeetings = this.fetched ? Promise.resolve() : this.refreshCache();
    return fetchMeetings.then(() => {
      return this.getCachedMeetings(room, start, end);
    });
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createMeeting(subj, start, duration, owner, room)
               .then(meeting => {
                 return this.cacheMeeting(meeting);
               })
               .catch(error => {
                 logger.error(error);
                 throw new Error(error);
               });
  }


  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const meeting = this.idCache.get(meetingId);
      meeting ? resolve(meeting) : reject('Unable to find meeting ' + meetingId);
    });
  }


  deleteMeeting(owner: Participant, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const meeting = ID_CACHE_STRATEGY.get(this.idCache, id);
      if (!meeting) {
        throw new Error(`Unable to find meeting id: ${id}`);
      }

      logger.info('Will CANCEL meeting from owner', meeting.owner);
      return this.delegatedMeetingsService
                 .deleteMeeting(meeting.owner, id)
                 .then(() => {
                   logger.info('MS Graph returned');
                   this.uncacheMeeting(id);
                   resolve();
                 });
    });
  }


  doSomeShiznit(test: any): Promise<any> {
    return this.delegatedMeetingsService.doSomeShiznit(test);
  }


  private getCachedMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    logger.info('searching meetings:', room, start, end);
    return new Promise((resolve) => {
      const owner = room.email;
      const roomName = room.name;
      const participantMeetings = PARTICIPANTS_CACHE_STRATEGY.get(this.participantCache, owner);
      // logger.info('For participant:', owner, 'found:', participantMeetings.map(m => m.id));
      logger.info('For participant:', owner, 'found:', participantMeetings);
      const roomMeetings = ROOM_CACHE_STRATEGY.get(this.roomCache, roomName);
      // logger.info('For room:', roomName, 'found:', roomMeetings);

      const allMeetings = [...(participantMeetings || []), ...(roomMeetings || [])];
      const meetings =  allMeetings || [];
      const filtered =  meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));
      logger.info('Filtered to:', filtered.map(m => m.id));

      resolve(filtered);
    });
  }


  private refreshCache(start: Moment = moment().subtract(1, 'day'),
                       end: Moment = moment().add(1, 'week')): Promise<void> {
    logger.info('Refreshing meetings');
    const meetingSvc = this.delegatedMeetingsService;
    return this.roomService.getRoomList('nyc')
               .then(roomList => {
                 return Promise.all(roomList.rooms.map(room => meetingSvc.getMeetings(room, start, end)))
                               .then(meetingsLists => {
                                 const meetings = meetingsLists.reduce((acc, meetingList) => {
                                   acc.push.apply(acc, meetingList);
                                   return acc;
                                 }, []);

                                 const meetingIds = meetings.map(meeting => meeting.id);
                                 meetings.forEach(this.cacheMeeting.bind(this));
                                 this.reconcileAndUncache(meetingIds);
                                 this.fetched = true;
                               })
                               .catch(error => {
                                 logger.error('Failed to cache meetings for');
                               });
               });
  }


  private reconcileAndUncache(meetingIds: string[]) {
    const existingMeetingIds = new Set(this.idCache.keys());
    const updatedMeetingIds = new Set(meetingIds);

    logger.info('Existing', existingMeetingIds.size, 'updated', updatedMeetingIds.size);
    updatedMeetingIds.forEach(id => existingMeetingIds.delete(id));
    existingMeetingIds.forEach(id => this.uncacheMeeting(id));
  }

  private cacheMeeting(meeting: Meeting) {
    ID_CACHE_STRATEGY.put(this.idCache, meeting);
    OWNER_CACHE_STRATEGY.put(this.ownerCache, meeting);
    PARTICIPANTS_CACHE_STRATEGY.put(this.participantCache, meeting);
    ROOM_CACHE_STRATEGY.put(this.roomCache, meeting);

    logger.info('Caching meeting', meeting.id);
    logger.debug('id keys', this.idCache.keys());
    logger.debug('owner keys', this.ownerCache.keys());
    logger.debug('participant keys', this.participantCache.keys());
    logger.debug('room keys', this.roomCache.keys());
    return meeting;
  }


  private uncacheMeeting(id: string) {
    logger.info('Uncaching meeting', id);
    const meeting = ID_CACHE_STRATEGY.get(this.idCache, id);

    ID_CACHE_STRATEGY.remove(this.idCache, meeting);
    OWNER_CACHE_STRATEGY.remove(this.ownerCache, meeting);
    PARTICIPANTS_CACHE_STRATEGY.remove(this.participantCache, meeting);
    ROOM_CACHE_STRATEGY.remove(this.roomCache, meeting);

    return meeting;
  }
}


class PassThroughMeetingService implements MeetingsService {

  meetings: Meeting[];

  constructor(private _domain: string) {
    this.meetings = new Array<Meeting>();
  }


  domain() {
    return this._domain;
  }


  getMeetings(room: Room, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    return Promise.resolve(this.meetings);
  }

  createMeeting(subj: string, start: moment.Moment, duration: moment.Duration, owner: Participant, room: Room): Promise<Meeting> {
    return new Promise((resolve) => {
      const meeting: Meeting = {
        id: `guid-${Math.random().toString()}`,
        owner: owner,
        title: subj,
        start: start,
        location: {displayName: room.name},
        end: start.clone().add(duration),
        participants: [owner, room],
      };

      this.meetings.push(meeting);
      resolve(meeting);
    });
  }

  deleteMeeting(owner: Participant, id: string): Promise<any> {
    this.meetings = this.meetings.filter(meeting => meeting.id === id);
    return Promise.resolve();
  }

  findMeeting(room: Room, id: string, start: moment.Moment, end: moment.Moment): Promise<Meeting> {
    const filtered = this.meetings.filter(meeting => meeting.id === id);
    if (filtered.length) {
      return Promise.resolve(filtered[0]);
    }
    return Promise.reject('No actual underlying meetings');
  }


  doSomeShiznit(test: any): Promise<any> {
    return Promise.reject('No actual underlying meetings');
  }
}
