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


// const DEFAULT_REFRESH = 120 * 1000;
const DEFAULT_REFRESH = 5 * 1000;

const ID_CACHE_STRATEGY = new IdCachingStrategy();
const PARTICIPANTS_CACHE_STRATEGY = new ParticipantsCachingStrategy();
const OWNER_CACHE_STRATEGY = new OwnerCachingStrategy();
const ROOM_CACHE_STRATEGY = new RoomCachingStrategy();


class PassThroughMeetingService implements MeetingsService {

  domain() {
    return 'FIXME';
  }


  getMeetings(room: Room, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    return Promise.resolve(new Array<Meeting>());
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

      resolve(meeting);
    });
  }

  deleteMeeting(owner: Participant, id: string): Promise<any> {
    return Promise.resolve();
  }

  findMeeting(room: Room, meetingId: string, start: moment.Moment, end: moment.Moment): Promise<Meeting> {
    return Promise.reject('No actual underlying meetings');
  }
}

export class CachedMeetingService implements MeetingsService {


  private jobId: NodeJS.Timer;


  private idCache = new Map<string, Meeting>();


  private ownerCache = new Map<string, Meeting[]>();


  private roomCache = new Map<string, Meeting[]>();


  private participantCache = new Map<string, Meeting[]>();


  constructor(private roomService: RoomService,
              private delegatedMeetingsService: MeetingsService = new PassThroughMeetingService()) {

    const _internalRefresh = () => {
      logger.info('Refreshing meetings now...');
      const start = moment().subtract(1, 'day');
      const end = moment().add(1, 'week');
      this.refreshCache(start, end);
    };

    logger.info('Constructing CachedMeetingService');
    _internalRefresh();
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH);

  }


  domain() {
    return this.delegatedMeetingsService.domain();
  }


  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => {
      const owner = room.email;
      const roomName = room.name;
      const participantMeetings = PARTICIPANTS_CACHE_STRATEGY.get(this.participantCache, owner);
      logger.info('For participant:', owner, 'found:', participantMeetings);
      const roomMeetings = ROOM_CACHE_STRATEGY.get(this.roomCache, roomName);
      logger.info('For room:', roomName, 'found:', roomMeetings);

      const allMeetings = [...(participantMeetings || []), ...(roomMeetings || [])];
      const meetings =  allMeetings || [];
      const filtered =  meetings.filter(meeting => isMeetingWithinRange(meeting, start, end));
      logger.info('Filtered to:', filtered);

      resolve(filtered);
    });
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    return this.delegatedMeetingsService
               .createMeeting(subj, start, duration, owner, room)
               .then(meeting => {
                 return this.cacheMeeting(meeting);
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

      return this.delegatedMeetingsService
                 .deleteMeeting(meeting.owner, id)
                 .then(() => {
                   this.uncacheMeeting(id);
                 });
    });
  }


  private refreshCache(start: Moment, end: Moment) {
    const meetingSvc = this.delegatedMeetingsService;
    this.roomService.getRoomList('nyc')
        .then(roomList => {
          Promise.all(roomList.rooms.map(room => meetingSvc.getMeetings(room, start, end)))
                 .then(meetingsLists => {
                   const meetings = meetingsLists.reduce((acc, meetingList) => {
                     acc.push.apply(acc, meetingList);
                     return acc;
                   }, []);

                   const meetingIds = meetings.map(meeting => meeting.id);
                   meetings.forEach(this.cacheMeeting.bind(this));
                   this.reconcileAndUncache(meetingIds);
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
