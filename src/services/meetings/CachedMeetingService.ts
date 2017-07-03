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
import {RoomSubCache} from './RoomSubCache';


const DEFAULT_REFRESH_IN_MILLIS = 300 * 1000;
// const DEFAULT_REFRESH_IN_MILLIS = 1 * 1000;


export class CachedMeetingService implements MeetingsService {

  private jobId: NodeJS.Timer;

  private roomSubCaches: Map<string, RoomSubCache>;

  constructor(private _domain: Domain,
              private roomService: RoomService,
              private delegatedMeetingsService?: MeetingsService) {

    const _internalRefresh = () => {
      this.refreshCaches().then(() => logger.info('Caches refreshed'));
    };

    if (!delegatedMeetingsService) {
      this.delegatedMeetingsService = new PassThroughMeetingService(_domain.domainName);
    }

    logger.info('Constructing CachedMeetingService');
    _internalRefresh();
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH_IN_MILLIS);
    this.roomSubCaches = new Map<string, RoomSubCache>();
  }


  domain() {
    return this.delegatedMeetingsService.domain();
  }


  getUserMeetings(user: Participant, start: Moment, end: Moment): Promise<Meeting[]> {
    /*
    Probably not necessary to cache user meetings since we will likely always fetch them
    from scratch.  Unless, we cache large date ranges
    */
    // TODO: fix this for user meetings
    return Promise.resolve([new Meeting()]);
  }


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


  private getCacheForRoom(room: Room): RoomSubCache {
    if (!this.roomSubCaches.has(room.email)) {
      const roomCache = new RoomSubCache(room);
      this.roomSubCaches.set(room.email, roomCache);
    }

    return this.roomSubCaches.get(room.email);
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
               .then(() => { return undefined; });
  }


  private refreshCache(room: Room, start: Moment, end: Moment): Promise<void> {
    const fetchMeetings = (): Promise<Meeting[]> => {
      const roomCache = this.getCacheForRoom(room);

      const fetchStart = roomCache.getFetchStart(start);
      const fetchEnd = roomCache.getFetchEnd(end);

      return this.delegatedMeetingsService.getMeetings(room, fetchStart, fetchEnd);
    };

    const cacheMeetings = (meetings: Meeting[]) => {
      const roomCache = this.getCacheForRoom(room);
      roomCache.cacheMeetings(meetings);
    };

    return fetchMeetings().then(cacheMeetings);
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


  private cacheMeeting(room: Room, meeting: Meeting) {
    return this.getCacheForRoom(room).put(meeting);
  }


  private evictMeeting(id: string) {
    this.roomSubCaches.forEach(cache => cache.remove(id));
  }


  private reconcileAndEvictUser(meetingIds: string[]) {
    // TODO: fix me
  }


  private cacheUserMeeting(meeting: Meeting) {
    logger.info('Evicting user meeting', meeting.id);
    // this.entitledOwnerCache.put(meeting);

    return meeting;
  }


  private evictUserMeeting(id: string) {
    logger.info('Evicting meeting', id);
    // const meeting = this.idCache.get(id);

    // this.entitledOwnerCache.remove(meeting);

    // return meeting;
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
