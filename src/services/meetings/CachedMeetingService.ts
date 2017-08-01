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
import {retryUntilAtInterval} from '../../utils/retry';
import {IdCachingStrategy} from './IdCachingStrategy';
import {IdentityCache} from '../../utils/cache/caches';
import {Attendee} from '../../model/Attendee';


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
      this.refreshRoomCaches()
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
    const roomCache = this.getRoomCacheForRoom(room);
    const fetch = roomCache.isCacheWithinBound(start, end) ? Promise.resolve() : this.refreshRoomCache(room, start, end);
    return fetch.then(() => roomCache.getMeetings(start, end));
  }


  createUserMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createUserMeeting(subj, start, duration, owner, room)
               .then(userMeeting => {
                 const roomMeeting = this.cacheRoomMeeting(room, userMeeting);
                 this.matchAndReplaceRoomMeeting(roomMeeting, room);

                 return this.cacheUserMeeting(owner, userMeeting);
               })
               .catch(error => {
                 logger.error(error);
                 throw new Error(error);
               });
  }


  updateUserMeeting(id: string, subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    logger.info('CachedMeetingService::updateUserMeeting() - updating meeting', id);
    const originalMeeting = this.getCacheForOwner(owner).get(id);
    return this.delegatedMeetingsService
               .updateUserMeeting(id, subj, start, duration, owner, room)
               .then(userMeeting => {
                 return this.evictRoomMeetingForUserMeeting(originalMeeting)
                            .then(roomMeeting => {
                              logger.info('Evicted', roomMeeting.id);
                              return userMeeting;
                            });
               })
               .then(userMeeting => {
                 // MS has a different meeting id for each version of a meeting so we need to evict the old id
                 this.evictUserMeeting(id);

                 const roomMeeting = this.cacheRoomMeeting(room, userMeeting);
                 this.matchAndReplaceRoomMeeting(roomMeeting, room);

                 return this.cacheUserMeeting(owner, userMeeting);
               })
               .catch(error => {
                 logger.error(error);
                 throw new Error(error);
               });
  }


  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const roomCache = this.getRoomCacheForRoom(room);
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
  deleteUserMeeting(owner: Participant, id: string): Promise<Meeting> {
    const userMeeting: Meeting = Array.from(this.ownerSubCaches.values()).reduce((acc, cache) => cache.get(id), undefined);

    if (!userMeeting) {
      logger.error('Could not find meeting', owner.email, id);
      return Promise.reject(`Unable to find meeting id: ${id}`);
    }

    logger.info('Will delete meeting from owner', userMeeting.owner, id);
    return this.delegatedMeetingsService
               .deleteUserMeeting(userMeeting.owner, userMeeting.id)
               .then(() => {
                 const userMeeting = this.evictUserMeeting(id);
                 return this.evictRoomMeetingForUserMeeting(userMeeting);
               })
               .then(meeting => {
                 return meeting;
               });
  }


  private evictRoomMeetingForUserMeeting(userMeeting: Meeting): Promise<Meeting> {
    const roomCache = this.getRoomCacheForMeeting(userMeeting);
    const [searchStart, searchEnd] = this.getSearchDateRange(userMeeting);
    return roomCache.getMeetings(searchStart, searchEnd)
                    .then(roomMeetings => {
                      logger.info('Got room meetings', roomMeetings.length);
                      return matchMeeting(userMeeting, roomMeetings);
                    })
                    .then(roomMeeting => {
                      logger.info(`Will evict room meeting ${roomMeeting.id}`);
                      return this.evictRoomMeeting(roomMeeting.id);
                    });
  }

  doSomeShiznit(test: any): Promise<any> {
    return this.delegatedMeetingsService.doSomeShiznit(test);
  }


  private matchAndReplaceRoomMeeting(meeting: Meeting, room: Room) {
    setTimeout(() => {
      const opBegin = moment();
      return this.waitForRoomMeeting(meeting, room)
                 .then((meetings) => {
                   this.evictRoomMeeting(meeting.id);
                   const opEnd = moment();
                   logger.info('MATCHED AND REPLACED MEETINGS!!!!!', (opEnd.diff(opBegin, 'milliseconds')),  meetings);
                 });

    }, 1000);
  }


  private waitForRoomMeeting(toMatch: Meeting, room: Room): Promise<Meeting[]> {
    const [searchStart, searchEnd] = this.getSearchDateRange(toMatch);
    const fetchMeetings = this.getMeetings.bind(this, room, searchStart, searchEnd);

    const matchedUserMeeting = matchMeeting.bind(this, toMatch);
    return retryUntilAtInterval(50, fetchMeetings, matchedUserMeeting);
  }


  private getRoomCacheForRoom(room: Room): SubCache<Room> {
    if (!this.roomSubCaches.has(room.email)) {
      const roomCache = new SubCache<Room>(room);
      this.roomSubCaches.set(room.email, roomCache);
    }

    return this.roomSubCaches.get(room.email);
  }


  private getRoomCacheForMeeting(meeting: Meeting): SubCache<Room> {
    return meeting.participants.reduce((cache, participant) => {
      return this.roomSubCaches.get(participant.email);
    }, undefined);
  }


  private getCacheForOwner(owner: Participant): SubCache<Participant> {
    if (!this.ownerSubCaches.has(owner.email)) {
      const roomCache = new SubCache<Participant>(owner);
      this.ownerSubCaches.set(owner.email, roomCache);
    }

    return this.ownerSubCaches.get(owner.email);
  }


  private refreshRoomCaches(): Promise<void> {
    const [defaultStart, defaultEnd] = this.getDefaultDateRange();

    return this.roomService.getRoomList('nyc')
               .then(roomList => {
                 const meetingPromises = roomList.rooms.map(room => this.refreshRoomCache(room, defaultStart, defaultEnd));
                 return Promise.all(meetingPromises);
               })
               .then(() => undefined);
  }


  private refreshUserCaches(): Promise<void> {
    const [defaultStart, defaultEnd] = this.getDefaultDateRange();

    const ownerEntries = Array.from(this.ownerSubCaches.entries());
    const refreshes = ownerEntries.map(kvPair => {
      const [, cache] = kvPair;
      const owner = cache.getAttendee();
      return this.refreshUserCache(owner, defaultStart, defaultEnd);
    });

    return Promise.all(refreshes).then(() => undefined);
  }


  // private refreshRoomCache(room: Room, start: Moment, end: Moment): Promise<void> {
  //   const fetchMeetings = (cache: SubCache<Attendee>,
  //                          getMeetings: (attendee: Attendee, start: Moment, end: Moment) => Promise<Meeting[]>): Promise<Meeting[]> => {
  //     const fetchStart = cache.getFetchStart(start);
  //     const fetchEnd = cache.getFetchEnd(end);
  //
  //     logger.info('GET MEETINGS', getMeetings);
  //     return getMeetings(room, fetchStart, fetchEnd);
  //   };
  //
  //   const roomCache = this.getCacheForRoom(room);
  //
  //   return fetchMeetings(roomCache, this.delegatedMeetingsService.getMeetings.bind(this)).then(roomMeetings => {
  //     logger.debug(`CachedMeetingService::refreshCache() - refreshed ${room.email}`, roomMeetings.length);
  //     roomCache.cacheMeetings(roomMeetings);
  //   });
  // }


  private refreshRoomCache(room: Room, start: Moment, end: Moment): Promise<void> {
    const roomCache = this.getRoomCacheForRoom(room);

    const fetchMeetings = (): Promise<Meeting[]> => {
      const fetchStart = roomCache.getFetchStart(start);
      const fetchEnd = roomCache.getFetchEnd(end);

      return this.delegatedMeetingsService.getMeetings(room, fetchStart, fetchEnd);
    };

    return fetchMeetings().then(roomMeetings => {
      logger.debug(`CachedMeetingService::refreshCache() - refreshed ${room.email}`, roomMeetings.length);
      roomCache.cacheMeetings(roomMeetings);
    });
  }


  private refreshUserCache(owner: Participant, start: Moment, end: Moment): Promise<void> {
    const userCache = this.getCacheForOwner(owner);

    const fetchMeetings = (): Promise<Meeting[]> => {
      const fetchStart = userCache.getFetchStart(start);
      const fetchEnd = userCache.getFetchEnd(end);

      return this.delegatedMeetingsService.getUserMeetings(owner, fetchStart, fetchEnd);
    };

    return fetchMeetings().then(userMeetings => {
      logger.debug(`CachedMeetingService::refreshCache() - refreshed ${owner.email}`);
      userCache.cacheMeetings(userMeetings);
    });
  }


  private cacheRoomMeeting(room: Room, meeting: Meeting) {
    const obscured = obscureMeetingDetails(meeting);
    return this.getRoomCacheForRoom(room).put(obscured);
  }


  private cacheUserMeeting(owner: Participant, meeting: Meeting) {
    return this.getCacheForOwner(owner).put(meeting);
  }


  private evictMeeting(id: string): Meeting|null {
    this.evictRoomMeeting(id);
    return this.evictUserMeeting(id);
  }


  private evictUserMeeting(id: string): Meeting|undefined {
    return this.evictMeetingFromCache(this.ownerSubCaches, id);
  }


  private evictRoomMeeting(id: string) {
    return this.evictMeetingFromCache(this.roomSubCaches, id);
  }


  private evictMeetingFromCache(caches: Map<string, SubCache<Attendee>>, id: string): Meeting|null {
    const cacheList = Array.from(caches.values());
    return cacheList.reduce((meeting, cache) => cache.remove(id), null);
  }

  /*

   */
  private getSearchDateRange(meeting: Meeting): Moment[] {
    const searchStart = meeting.start.clone().subtract('1', 'second');
    const searchEnd = meeting.end.clone().add('1', 'second');

    return [searchStart, searchEnd];
  }

  private getDefaultDateRange(): Moment[] {
    const defaultStart = moment().subtract(1, 'day').startOf('day');
    const defaultEnd = moment().add(1, 'week').endOf('day');

    return [defaultStart, defaultEnd];
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


  createUserMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return new Promise((resolve) => {
      const userMeetingId = 'user_' + uuid();
      const roomMeetingId = 'room_' + uuid();

      const startUTC = moment.utc(start);
      const endUTC = moment.utc(start.clone().add(duration));

      const userMeeting: Meeting = {
        id: userMeetingId,
        userMeetingId: roomMeetingId,
        owner: owner,
        title: subj, // simulates microsoft's behavior
        start: startUTC,
        location: {displayName: room.name},
        end: endUTC,
        participants: [owner, room],
      };

      logger.info('MockGraphMeetingService::createUserMeeting()', userMeeting);
      this.userMeetingCache.put(userMeeting);

      const addRoomMeeting = () => {
        const roomMeeting: Meeting = {
          id: roomMeetingId,
          userMeetingId: userMeeting.id,
          owner: owner,
          title: owner.name, // simulates microsoft's behavior
          start: startUTC,
          location: {displayName: room.name},
          end: endUTC,
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


  updateUserMeeting(userMeetingId: string, subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    function update(meeting: Meeting, start: Moment, duration: Duration, subj?: string) {
      if (!meeting) {
        return null;
      }

      meeting.start = moment.utc(start);
      meeting.end = meeting.start.clone().add(duration);

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
