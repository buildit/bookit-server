import * as moment from 'moment';
import {Moment} from 'moment';

import {Meeting} from '../../model/Meeting';
import {RootLog as logger} from '../../utils/RootLogger';
import {isMeetingWithinRange} from '../../utils/validation';
import {IdCachingStrategy} from './IdCachingStrategy';
import {ParticipantsCachingStrategy} from './ParticipantsCachingStrategy';
import {OwnerCachingStrategy} from './OwnerCachingStrategy';
import {RoomCachingStrategy} from './RoomCachingStrategy';
import {Room} from '../../model/Room';
import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';
import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';
import {StartDateCachingStrategy} from './StartDateCachingStrategy';
import {EndDateCachingStrategy} from './EndDateCachingStrategy';



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



export class RoomSubCache {

  private idCache = new IdentityCache<Meeting>(new Map<string, Meeting>(), new IdCachingStrategy());
  private ownerCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new OwnerCachingStrategy());
  private participantCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new ParticipantsCachingStrategy());
  private roomCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new RoomCachingStrategy());
  private startDateCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new StartDateCachingStrategy());
  private endDateCache = new ListCache<Meeting>(new Map<string, Meeting[]>(), new EndDateCachingStrategy());

  private cacheStart: moment.Moment;
  private cacheEnd: moment.Moment;

  constructor(private room: Room) {
    this.cacheStart = undefined;
    this.cacheEnd = undefined;

    logger.info(`Constructing RoomSubCache (${this.room.email})`);
  }


  getFetchStart(start: Moment): Moment {
    if (!this.cacheStart) {
      return start;
    }

    return start.isBefore(this.cacheStart) ? start : this.cacheStart;
  }


  getFetchEnd(end: Moment): Moment {
    if (!this.cacheEnd) {
      return end;
    }

    return end.isAfter(this.cacheEnd) ? end : this.cacheEnd;
  }


  get(meetingId: string): Meeting {
    return this.idCache.get(meetingId);
  }


  put(meeting: Meeting): Meeting {
    return this.cacheMeeting(meeting);
  }


  remove(meetingId: string) {
    this.evictMeeting(meetingId);
  }


  public cacheMeetings(meetings: Meeting[]) {

    const meetingIds = meetings.map(meeting => meeting.id);
    meetings.forEach(this.cacheMeeting.bind(this));
    this.reconcileAndEvict(meetingIds);
  }


  private updateCacheStart(_start: moment.Moment): boolean {
    const start = _start.clone().startOf('day');
    if (start.isBefore(this.cacheStart)) {
      this.cacheStart = start;
      logger.info(`${this.room.email} updated start`, this.cacheStart);
      return true;
    }

    logger.info(`${this.room.email} will use existing start`, this.cacheStart);
    return false;
  }


  private updateCacheEnd(_end: moment.Moment): boolean {
    const end = _end.clone().endOf('day');
    if (end.isAfter(this.cacheEnd)) {
      this.cacheEnd = end;
      logger.info(`${this.room.email} updated end`, this.cacheEnd);
      return true;
    }

    logger.info(`${this.room.email} will use existing end`, this.cacheEnd);
    return false;
  }


  public getMeetings(start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const owner = this.room.email;
      const roomName = this.room.name;
      const participantMeetings = this.participantCache.get(owner) || [];
      logger.debug('RoomCache:: for participant:', owner, 'found:', participantMeetings.map(m => m.id));
      const roomMeetings = this.roomCache.get(roomName) || [];
      logger.debug('RoomCache:: for room:', roomName, 'found:', roomMeetings);

      const meetingIdMap = new Map<string, Meeting>();
      participantMeetings.forEach(meeting => meetingIdMap.set(meeting.id, meeting));
      roomMeetings.forEach(meeting => meetingIdMap.set(meeting.id, meeting));

      const meetings =  Array.from(meetingIdMap.values()) || [];
      logger.info('CachedMeetingService::getCachedRoomMeetings() - filter is:', start, end);
      // logger.info(`CachedMeetingService::getCachedRoomMeetings() - meetings (${owner}) are`, meetings);

      const filtered =  meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));
      logger.info(`CachedMeetingService::getCachedRoomMeetings() filtered to (${owner}):`, filtered.map(m => m.id));

      return resolve(filtered);
    });
  }


  private reconcileAndEvict(meetingIds: string[]) {
    const existingMeetingIds = new Set(this.idCache.keys());
    const updatedMeetingIds = new Set(meetingIds);

    logger.info(`Reconciling ${this.room.email} cache - existing:`, existingMeetingIds.size, 'updated:', updatedMeetingIds.size);
    updatedMeetingIds.forEach(id => existingMeetingIds.delete(id));
    existingMeetingIds.forEach(id => this.evictMeeting(id));
  }


  private cacheMeeting(meeting: Meeting) {
    this.idCache.put(meeting);
    this.ownerCache.put(meeting);
    this.participantCache.put(meeting);
    this.roomCache.put(meeting);
    this.startDateCache.put(meeting);
    this.endDateCache.put(meeting);

    this.updateCacheStart(meeting.start);
    this.updateCacheEnd(meeting.end);

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
    this.startDateCache.remove(meeting);
    this.endDateCache.remove(meeting);

    return meeting;
  }


  isCacheWithinBound(start: moment.Moment, end: moment.Moment) {
    return start.isSameOrAfter(this.cacheStart) && end.isSameOrBefore(end);
  }
}

