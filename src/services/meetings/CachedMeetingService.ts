import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {v4 as uuid} from 'uuid';

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
import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';
import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';


const DEFAULT_REFRESH_IN_MILLIS = 300 * 1000;
// const DEFAULT_REFRESH_IN_MILLIS = 1 * 1000;


class IdentityCache<RType> {
  constructor(private cache: Map<string, RType>, private strategy: IdentityCachingStrategy<RType>) {
  }

  put(meeting: RType) {
    this.strategy.put(this.cache, meeting);
  }

  get(key: string): RType {
    return this.strategy.get(this.cache, key);
  }

  remove(meeting: RType) {
    this.strategy.remove(this.cache, meeting);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}


class ListCache<RType> {
  constructor(private cache: Map<string, RType[]>, private strategy: ListCachingStrategy<RType>) {
  }

  put(meeting: RType) {
    this.strategy.put(this.cache, meeting);
  }

  get(key: string): RType[] {
    return this.strategy.get(this.cache, key);
  }

  remove(meeting: RType) {
    this.strategy.remove(this.cache, meeting);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}



export class CachedMeetingService implements MeetingsService {

  private fetched: boolean;

  private jobId: NodeJS.Timer;

  private idCache = new IdentityCache<Meeting>(new Map<string, Meeting>(), new IdCachingStrategy());
  private ownerCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new OwnerCachingStrategy());
  private participantCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new ParticipantsCachingStrategy());
  private roomCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new RoomCachingStrategy());


  private entitledIdCache = new IdentityCache<Meeting>(new Map<string, Meeting>(), new IdCachingStrategy());
  private entitledOwnerCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new OwnerCachingStrategy());


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
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH_IN_MILLIS);
  }


  domain() {
    return this.delegatedMeetingsService.domain();
  }


  getUserMeetings(user: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    /*
    Probably not necessary to cache user meetings since we will likely always fetch them
    from scratch.  Unless, we cache large date ranges
    */
    return this.refreshForUserCache(user)
               .then(() => { return this.getUserCachedMeetings(user, start, end); });
  }


  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    const fetchMeetings = this.fetched ? Promise.resolve() : this.refreshCache();
    return fetchMeetings.then(() => {
      return this.getCachedRoomMeetings(room, start, end);
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
      const meeting = this.idCache.get(id);
      if (!meeting) {
        throw new Error(`Unable to find meeting id: ${id}`);
      }

      logger.info('Will delete meeting from owner', meeting.owner);
      return this.delegatedMeetingsService
                 .deleteMeeting(meeting.owner, id)
                 .then(() => {
                   logger.info('MS Graph returned');
                   this.evictMeeting(id);
                   resolve();
                 });
    });
  }


  doSomeShiznit(test: any): Promise<any> {
    return this.delegatedMeetingsService.doSomeShiznit(test);
  }


  private getCachedRoomMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    // logger.info('searching meetings:', room, start, end);
    return new Promise((resolve) => {
      const owner = room.email;
      const roomName = room.name;
      const participantMeetings = this.participantCache.get(owner) || [];
      logger.debug('RoomCache:: for participant:', owner, 'found:', participantMeetings.map(m => m.id));
      const roomMeetings = this.roomCache.get(roomName) || [];
      logger.debug('RoomCache:: for room:', roomName, 'found:', roomMeetings);

      const meetingIdMap = new Map<string, Meeting>();
      participantMeetings.forEach(meeting => meetingIdMap.set(meeting.id, meeting));
      roomMeetings.forEach(meeting => meetingIdMap.set(meeting.id, meeting));

      const meetings =  Array.from(meetingIdMap.values()) || [];
      const filtered =  meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));
      logger.debug('RoomCache:: filtered to:', filtered.map(m => m.id));

      return resolve(filtered);
    });
  }


  private getUserCachedMeetings(participant: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    logger.info('searching user meetings:', participant, start, end);
    return new Promise((resolve) => {
      const owner = participant.email;
      const ownerMeetings = this.entitledOwnerCache.get(owner);
      const meetings = ownerMeetings || [];
      const filtered = meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));
      logger.info('UserCache:: Filtered to:', filtered.map(m => m.id));

      return resolve(filtered);
    });
  }


  private refreshCache(start: Moment = moment().subtract(1, 'day'),
                       end: Moment = moment().add(1, 'week')): Promise<void> {
    logger.info('refreshCache:: refreshing meetings');
    const meetingSvc = this.delegatedMeetingsService;
    return this.roomService.getRoomList('nyc')
               .then(roomList => {
                 const meetingPromises = roomList.rooms.map(room => meetingSvc.getMeetings(room, start, end));
                 return Promise.all(meetingPromises)
                               .then(meetingsLists => {
                                 const meetings = meetingsLists.reduce((acc, meetingList) => {
                                   acc.push.apply(acc, meetingList);
                                   return acc;
                                 }, []);

                                 const meetingIds = meetings.map(meeting => meeting.id);
                                 meetings.forEach(this.cacheMeeting.bind(this));
                                 this.reconcileAndUncache(meetingIds);
                                 this.fetched = true;
                                 return true;
                               })
                               .catch(error => {
                                 logger.error('Failed to cache meetings for');
                               });
               });
  }


  private refreshForUserCache(owner: Participant,
                              start: Moment = moment().subtract(1, 'day'),
                              end: Moment = moment().add(1, 'week')): Promise<void> {
    logger.info('refreshCache:: refreshing meetings');
    return this.delegatedMeetingsService
               .getUserMeetings(owner, start, end)
               .then(meetings => {
                 const meetingIds = meetings.map(meeting => meeting.id);
                 meetings.forEach(this.cacheUserMeeting.bind(this));
                 this.reconcileAndEvictUser(meetingIds);
               });
  }


  private reconcileAndUncache(meetingIds: string[]) {
    const existingMeetingIds = new Set(this.idCache.keys());
    const updatedMeetingIds = new Set(meetingIds);

    logger.info('Existing', existingMeetingIds.size, 'updated', updatedMeetingIds.size);
    updatedMeetingIds.forEach(id => existingMeetingIds.delete(id));
    existingMeetingIds.forEach(id => this.evictMeeting(id));
  }

  private cacheMeeting(meeting: Meeting) {
    this.idCache.put(meeting);
    this.ownerCache.put(meeting);
    this.participantCache.put(meeting);
    this.roomCache.put(meeting);

    logger.info('Caching meeting', meeting.id);
    logger.debug('id keys', this.idCache.keys());
    logger.debug('owner keys', this.ownerCache.keys());
    logger.debug('participant keys', this.participantCache.keys());
    logger.debug('room keys', this.roomCache.keys());
    return meeting;
  }


  private evictMeeting(id: string) {
    logger.info('Uncaching meeting', id);
    const meeting = this.idCache.get(id);

    this.idCache.remove(meeting);
    this.ownerCache.remove(meeting);
    this.participantCache.remove(meeting);
    this.roomCache.remove(meeting);

    return meeting;
  }


  private reconcileAndEvictUser(meetingIds: string[]) {
    const existingMeetingIds = new Set(this.idCache.keys());
    const updatedMeetingIds = new Set(meetingIds);

    logger.info('Existing', existingMeetingIds.size, 'updated', updatedMeetingIds.size);
    updatedMeetingIds.forEach(id => existingMeetingIds.delete(id));
    existingMeetingIds.forEach(id => this.evictMeeting(id));
  }


  private cacheUserMeeting(meeting: Meeting) {
    logger.info('Evicting user meeting', meeting.id);
    this.entitledOwnerCache.put(meeting);

    return meeting;
  }


  private evictUserMeeting(id: string) {
    logger.info('Evicting meeting', id);
    const meeting = this.idCache.get(id);

    this.entitledOwnerCache.remove(meeting);

    return meeting;
  }

}


class PassThroughMeetingService implements MeetingsService {

  meetings: Meeting[];
  userMeetings: Meeting[];

  constructor(private _domain: string) {
    this.meetings = new Array<Meeting>();
    this.userMeetings = new Array<Meeting>();
  }


  domain() {
    return this._domain;
  }


  getMeetings(room: Room, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    const mappedMeetings = this.meetings.map(meeting => {
      const copy = Object.assign({}, meeting);
      copy.title = meeting.owner.name;

      return copy;
    });

    logger.info('getMeetings::', mappedMeetings);
    return Promise.resolve(this.meetings);
  }


  getUserMeetings(user: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    return Promise.resolve(this.userMeetings.filter(meeting => meeting.owner.email === user.email));
  }


  createMeeting(subj: string, start: moment.Moment, duration: moment.Duration, owner: Participant, room: Room): Promise<Meeting> {
    return new Promise((resolve) => {
      const roomMeeting: Meeting = {
        id: uuid(),
        owner: owner,
        title: owner.name, // simulates microsoft's behavior
        start: start,
        location: {displayName: room.name},
        end: start.clone().add(duration),
        participants: [owner, room],
      };


      this.meetings.push(roomMeeting);

      const userMeeting: Meeting = {
        id: roomMeeting.id,
        owner: owner,
        title: subj, // simulates microsoft's behavior
        start: start,
        location: {displayName: room.name},
        end: start.clone().add(duration),
        participants: [owner, room],
      };

      this.userMeetings.push(userMeeting);

      resolve(roomMeeting);
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

    return Promise.reject('Meeting not found');
  }


  doSomeShiznit(test: any): Promise<any> {
    return Promise.reject('No actual underlying meetings');
  }
}
