import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {v4 as uuid} from 'uuid';

import {Meeting} from '../../model/Meeting';
import {MeetingsService} from './MeetingService';
import {Participant} from '../../model/Participant';
import {RootLog as logger} from '../../utils/RootLogger';
import {isMeetingWithinRange} from '../../utils/validation';
import {RoomService} from '../rooms/RoomService';
import {Room} from '../../model/Room';
import {Domain} from '../../model/EnvironmentConfig';
import {SubCache} from './SubCache';


const DEFAULT_REFRESH_IN_MILLIS = 300 * 1000;
// const DEFAULT_REFRESH_IN_MILLIS = 1 * 1000;


export class CachedMeetingService implements MeetingsService {

  private jobId: NodeJS.Timer;

  private roomSubCaches: Map<string, SubCache<Room>>;

  private ownerSubCaches: Map<string, SubCache<Participant>>;

  constructor(private _domain: Domain,
              private roomService: RoomService,
              private delegatedMeetingsService?: MeetingsService) {

    const _internalRefresh = () => {
      /*
      Do a refresh of the caches based on their bounds or a computed default window.  I would like to eventually
      tie the user cache refreshes against user participants from the rooms.
       */
      this.refreshCaches()
          .then(() => this.refreshUserCaches())
          .then(() => logger.info('Caches refreshed'));
    };

    if (!delegatedMeetingsService) {
      this.delegatedMeetingsService = new PassThroughMeetingService(_domain.domainName);
    }

    logger.info('Constructing CachedMeetingService');
    _internalRefresh();
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH_IN_MILLIS);
    this.roomSubCaches = new Map<string, SubCache<Room>>();
    this.ownerSubCaches = new Map<string, SubCache<Participant>>();
  }


  domain() {
    return this.delegatedMeetingsService.domain();
  }


  getUserMeetings(user: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    const userCache = this.getCacheForOwner(user);
    const fetch = userCache.isCacheWithinBound(start, end) ? Promise.resolve() : this.refreshUserCache(user, start, end);
    return fetch.then(() => userCache.getMeetings(start, end));
  }


  /**
   * This gets the meetings for a particular date bound against a particular room resource.
   *
   * We will consult if the date bound is contained within the room's cache.  If not, we will refresh with
   * a larger window and allow the fetch from cache to proceed.
   *
   * NB: This can be further optimized but we'll leave it as is for now.
   * @param room
   * @param start
   * @param end
   * @returns {Promise<TResult2|Meeting[]>}
   */
  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    const roomCache = this.getCacheForRoom(room);
    const fetch = roomCache.isCacheWithinBound(start, end) ? Promise.resolve() : this.refreshCache(room, start, end);
    return fetch.then(() => roomCache.getMeetings(start, end));
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createMeeting(subj, start, duration, owner, room)
               .then(meeting => this.cacheMeeting(room, meeting))
               .catch(error => {
                 logger.error(error);
                 throw new Error(error);
               });
  }


  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const roomCache = this.getCacheForRoom(room);
      const meeting = roomCache.get(meetingId);
      meeting ? resolve(meeting) : reject('Unable to find meeting ' + meetingId);
    });
  }


  deleteMeeting(owner: Participant, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const found = Array.from(this.roomSubCaches.values())
                         .some(cache => cache.get(id) != null);

      if (!found) {
        throw new Error(`Unable to find meeting id: ${id}`);
      }

      logger.info('Will delete meeting from owner', owner);
      return this.delegatedMeetingsService
                 .deleteMeeting(owner, id)
                 .then(() => {
                   this.evictMeeting(id);
                   resolve();
                 });
    });
  }


  doSomeShiznit(test: any): Promise<any> {
    return this.delegatedMeetingsService.doSomeShiznit(test);
  }


  private getCacheForRoom(room: Room): SubCache<Room> {
    if (!this.roomSubCaches.has(room.email)) {
      const roomCache = new SubCache<Room>(room);
      this.roomSubCaches.set(room.email, roomCache);
    }

    return this.roomSubCaches.get(room.email);
  }


  private getCacheForOwner(owner: Participant): SubCache<Participant> {
    if (!this.ownerSubCaches.has(owner.email)) {
      const roomCache = new SubCache<Participant>(owner);
      this.ownerSubCaches.set(owner.email, roomCache);
    }

    return this.ownerSubCaches.get(owner.email);
  }


  private refreshCaches(): Promise<void> {
    const defaultStart = moment().subtract(1, 'day').startOf('day');
    const defaultEnd = moment().add(1, 'week').endOf('day');

    logger.info('CachedMeetingService::refreshCaches() - refreshing meetings');
    return this.roomService.getRoomList('nyc')
               .then(roomList => {
                 const meetingPromises = roomList.rooms.map(room => this.refreshCache(room, defaultStart, defaultEnd));
                 return Promise.all(meetingPromises);
               })
               .then(() => undefined);
  }


  private refreshUserCaches(): Promise<void> {
    const defaultStart = moment().subtract(1, 'day').startOf('day');
    const defaultEnd = moment().add(1, 'week').endOf('day');

    const ownerEntries = Array.from(this.ownerSubCaches.entries());
    logger.info('CachedMeetingService::refreshCaches() - refreshing user meetings', ownerEntries);
    const refreshes = ownerEntries.map(kvPair => {
      const [, cache] = kvPair;
      const owner = cache.getAttendee();
      return this.refreshUserCache(owner, defaultStart, defaultEnd);
    });

    return Promise.all(refreshes).then(() => undefined);
  }


  private refreshCache(room: Room, start: Moment, end: Moment): Promise<void> {
    const roomCache = this.getCacheForRoom(room);

    const fetchMeetings = (): Promise<Meeting[]> => {
      const fetchStart = roomCache.getFetchStart(start);
      const fetchEnd = roomCache.getFetchEnd(end);

      return this.delegatedMeetingsService.getMeetings(room, fetchStart, fetchEnd);
    };

    const cacheMeetings = (meetings: Meeting[]) => roomCache.cacheMeetings(meetings);

    logger.info(`CachedMeetingService::refreshCache() - refreshing ${room.email}`);
    return fetchMeetings().then(cacheMeetings);
  }


  private refreshUserCache(owner: Participant, start: Moment, end: Moment): Promise<void> {
    const userCache = this.getCacheForOwner(owner);

    const fetchMeetings = (): Promise<Meeting[]> => {
      const fetchStart = userCache.getFetchStart(start);
      const fetchEnd = userCache.getFetchEnd(end);

      return this.delegatedMeetingsService.getUserMeetings(owner, fetchStart, fetchEnd);
    };

    const cacheMeetings = (meetings: Meeting[]) => {
      userCache.cacheMeetings(meetings);
    };

    logger.info(`CachedMeetingService::refreshCache() - refreshing user ${owner.email}`);
    return fetchMeetings().then(cacheMeetings);
  }


  private cacheMeeting(room: Room, meeting: Meeting) {
    return this.getCacheForRoom(room).put(meeting);
  }


  private evictMeeting(id: string) {
    this.roomSubCaches.forEach(cache => cache.remove(id));
    this.ownerSubCaches.forEach(cache => cache.remove(id));
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

    logger.info('PassThroughMeetingService::getMeetings() - resolving', mappedMeetings.map(m => m.id));
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
