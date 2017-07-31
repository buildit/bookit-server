import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {v4 as uuid} from 'uuid';

import {Meeting} from '../../model/Meeting';
import {MeetingsService} from './MeetingService';
import {Participant} from '../../model/Participant';
import {RootLog as logger} from '../../utils/RootLogger';
import {RoomService} from '../rooms/RoomService';
import {Room} from '../../model/Room';
import {Domain} from '../../model/EnvironmentConfig';
import {SubCache} from './SubCache';
import {matchMeeting, obscureMeetingDetails} from '../../rest/meetings/meeting_functions';
import {retryUntil, retryUntilAtInterval} from '../../utils/retry';
import {IdCachingStrategy} from './IdCachingStrategy';
import {IdentityCache} from '../../utils/cache/caches';


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
      this.delegatedMeetingsService = new MockGraphMeetingService(_domain.domainName);
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


  clearCaches() {
    this.roomSubCaches = new Map<string, SubCache<Room>>();
    this.ownerSubCaches = new Map<string, SubCache<Participant>>();

    this.delegatedMeetingsService.clearCaches();
    return true;
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


  createUserMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createUserMeeting(subj, start, duration, owner, room)
               .then(userMeeting => this.cacheUserMeeting(owner, userMeeting))
               .then(userMeeting => {
                 return this.waitForRoomMeeting(userMeeting, start, duration, room)
                            .then(() => userMeeting);
               })
               .catch(error => {
                 logger.error(error);
                 throw new Error(error);
               });
  }


  updateUserMeeting(id: string, subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    logger.info('CachedMeetingService::updateUserMeeting() - updating meeting', id);
    return this.delegatedMeetingsService
               .updateUserMeeting(id, subj, start, duration, owner, room)
               .then(userMeeting => this.cacheUserMeeting(owner, userMeeting))
               .then(userMeeting => {
                 return this.waitForRoomMeeting(userMeeting, start, duration, room)
                            .then(() => userMeeting);
               })
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


  /**
   * The rest interface for delete expects a room e-mail and a meeting id.  The assumptions for all this stuff
   * has changed a bit and we wanted to maintain the interface while changing the underlying behavior.
   * @param owner
   * @param id
   * @returns {Promise<T>}
   */
  deleteUserMeeting(owner: Participant, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const userMeeting = Array.from(this.ownerSubCaches.values()).reduce((acc, cache) => cache.get(id), undefined);

      if (!userMeeting) {
        logger.error('Could not find meeting', owner.email, id);
        return reject(`Unable to find meeting id: ${id}`);
      }

      logger.info('Will delete meeting from owner', owner.email, id);
      return this.delegatedMeetingsService
                 .deleteUserMeeting(userMeeting.owner, userMeeting.id)
                 .then(() => {
                   this.evictMeeting(id);
                   resolve();
                 });
    });
  }


  doSomeShiznit(test: any): Promise<any> {
    return this.delegatedMeetingsService.doSomeShiznit(test);
  }


  private waitForRoomMeeting(toMatch: Meeting, start: Moment, duration: Duration, room: Room): Promise<Meeting[]> {
    const searchStart = start.clone().subtract('1', 'second');
    const searchEnd = start.clone().add(duration).add('1', 'second');
    const fetchMeetings = this.getMeetings.bind(this, room, searchStart, searchEnd);

    const matchedUserMeeting = matchMeeting.bind(this, toMatch);
    return retryUntilAtInterval(50, fetchMeetings, matchedUserMeeting);
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
    logger.debug('CachedMeetingService::refreshCaches() - refreshing user meetings', ownerEntries);
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

    return fetchMeetings().then(meetings => {
      logger.debug(`CachedMeetingService::refreshCache() - refreshed ${room.email}`, meetings.length);
      cacheMeetings(meetings);
    });
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

    logger.debug(`CachedMeetingService::refreshCache() - refreshing user ${owner.email}`);
    return fetchMeetings().then(cacheMeetings);
  }


  private cacheRoomMeeting(room: Room, meeting: Meeting) {
    return this.getCacheForRoom(room).put(meeting);
  }


  private cacheUserMeeting(owner: Participant, meeting: Meeting) {
    logger.info('Caching meeting', meeting.id);
    return this.getCacheForOwner(owner).put(meeting);
  }


  private evictMeeting(id: string) {
    this.roomSubCaches.forEach(cache => cache.remove(id));
    this.ownerSubCaches.forEach(cache => cache.remove(id));
  }

}


/**
 * This class is a mock service but also attempts to imitate Microsoft's API behavior
 */
class MockGraphMeetingService implements MeetingsService {

  private userMeetingCache = new IdentityCache<Meeting>(new Map<string, Meeting>(), new IdCachingStrategy());
  private roomMeetingCache = new IdentityCache<Meeting>(new Map<string, Meeting>(), new IdCachingStrategy());


  constructor(private _domain: string) {
    this.clearCaches(true);
  }


  domain() {
    return this._domain;
  }


  clearCaches(initializing = false) {
    const type = initializing ? ' Initializing' : 'Clearing';
    logger.info(`${type} Mock Graph caches`);
    this.roomMeetingCache.clear();
    this.userMeetingCache.clear();

    return true;
  }


  getMeetings(room: Room, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    const roomMeetings = this.roomMeetings().filter(meeting => meeting.location.displayName === room.name);
    const mappedMeetings = roomMeetings.map(obscureMeetingDetails);

    if (mappedMeetings.length > 0) {
      logger.info(`PassThroughMeetingService::getMeetings(${room.email}) - resolving`, mappedMeetings.map(m => m.id));
    }

    return Promise.resolve(roomMeetings);
  }


  getUserMeetings(user: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    const filtered = this.userMeetings().filter(meeting => meeting.owner.email === user.email);
    logger.info('Filtered user meetings', filtered);
    return Promise.resolve(filtered);
  }


  createUserMeeting(subj: string, start: moment.Moment, duration: moment.Duration, owner: Participant, room: Room): Promise<Meeting> {
    return new Promise((resolve) => {
      const userMeetingId = 'user_' + uuid();
      const roomMeetingId = 'room_' + uuid();

      const userMeeting: Meeting = {
        id: userMeetingId,
        userMeetingId: roomMeetingId,
        owner: owner,
        title: subj, // simulates microsoft's behavior
        start: start,
        location: {displayName: room.name},
        end: start.clone().add(duration),
        participants: [owner, room],
      };

      this.userMeetingCache.put(userMeeting);

      const addRoomMeeting = () => {
        const roomMeeting: Meeting = {
          id: roomMeetingId,
          userMeetingId: userMeeting.id,
          owner: owner,
          title: owner.name, // simulates microsoft's behavior
          start: start,
          location: {displayName: room.name},
          end: start.clone().add(duration),
          participants: [owner, room],
        };

        this.roomMeetingCache.put(roomMeeting);
      };

      /*
       when creating a user meeting with the graph, it updates that perspective immediately with the new information
       but we need to simulate the delay from the room perspective.
        */

      MockGraphMeetingService.withDelay(addRoomMeeting);

      resolve(userMeeting);
    });
  }


  updateUserMeeting(userMeetingId: string, subj: string, start: moment.Moment, duration: moment.Duration, owner: Participant, room: Room): Promise<Meeting> {
    function update(meeting: Meeting, start: moment.Moment, duration: moment.Duration, subj?: string) {
      if (!meeting) {
        return null;
      }

      meeting.start = start;
      meeting.end = start.clone().add(duration);

      if (subj) {
        meeting.title = subj;
      }

      return meeting;
    }

    return new Promise((resolve) => {
      logger.info('MockGraphMeetingService::updateUserMeeting() - updating', userMeetingId);
      const userMeeting = this.userMeetingCache.get(userMeetingId);
      update(userMeeting, start, duration, subj);

      const updateRoomMeeting = () => {
        const roomMeeting = this.roomMeetingCache.get(userMeeting.userMeetingId);
        update(roomMeeting, start, duration);
      };

      MockGraphMeetingService.withDelay(updateRoomMeeting);

      resolve(userMeeting);
    });
  }


  deleteUserMeeting(owner: Participant, id: string): Promise<any> {
    const userMeeting = this.userMeetingCache.get(id);
    this.userMeetingCache.remove(userMeeting);

    const roomMeeting = this.roomMeetingCache.get(userMeeting.userMeetingId);
    this.roomMeetingCache.remove(roomMeeting);

    return Promise.resolve();
  }


  findMeeting(room: Room, id: string, start: moment.Moment, end: moment.Moment): Promise<Meeting> {
    const roomMeeting = this.roomMeetingCache.get(id);
    if (roomMeeting) {
      return Promise.resolve(roomMeeting);
    }

    return Promise.reject('Meeting not found');
  }


  doSomeShiznit(test: any): Promise<any> {
    return Promise.reject('No actual underlying meetings');
  }


  private userMeetings(): Meeting[] {
    return Array.from(this.userMeetingCache.values());
  }


  private roomMeetings(): Meeting[] {
    return Array.from(this.roomMeetingCache.values());
  }


  private static withDelay(f: (args: any[]) => void) {
    const padding = 25 + (Math.random() * 75);
    const additional = Math.random() * 400;

    const delay = padding + additional;
    setTimeout(f, delay);
  }
}
