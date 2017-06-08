import {TaskQueue} from 'cwait';
import * as moment from 'moment';
import {Duration, Moment} from 'moment';

import {RootLog as logger} from '../RootLogger';

import {MeetingsService} from '../../services/meetings/MeetingService';
import {MeetingHelper} from './MeetingHelper';
import {RoomService} from '../../services/rooms/RoomService';
import {Room} from '../../model/Room';
import {Participant} from '../../model/Participant';

export interface GeneratorConfig {
  readonly maxMeetings: number;
  readonly titles: string[];
  readonly names: string[];
  readonly topics: string[];
  readonly maxDuration: Duration;
  readonly maxEventDelay: Duration;
  readonly hostUser: string;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  maxMeetings: 100,
  titles: ['Inspirational lunch with {n}', 'New {t} stuff from {n}', 'Presentation of {t} by {n} and his friends', 'Sales proposal discussion about {t}'],
  names: ['Alex', 'Zac', 'Nicole', 'Roman', 'Grommit'],
  topics: ['tomatoes', 'rotten tomatoes', 'art house', 'Google', 'Pink Easter Egg', 'Firing Joe'],
  maxDuration: moment.duration(2, 'hours'),
  maxEventDelay: moment.duration(5, 'hours'),
  hostUser: 'romans@myews.onmicrosoft.com'
};

const queue = new TaskQueue(Promise, 7);

export function generateMeetings(roomService: RoomService,
                                 meetingsService: MeetingsService,
                                 start: Moment = moment().add(-1, 'day'),
                                 end: Moment = moment().add(1, 'weeks'),
                                 config: GeneratorConfig = DEFAULT_CONFIG): Promise<any> {
  // should config be used instead of AppConfig?
  return roomService.getRoomLists()
                    .then(roomLists => {
                      return Promise.all(roomLists[0].rooms.map(
                        room => regenerateEvents(room, start, end, meetingsService, DEFAULT_CONFIG)));
                    });

}


function regenerateEvents(room: Room, start: Moment, end: Moment, svc: MeetingsService, conf: GeneratorConfig): Promise<any> {
  const roomMeetingHelper = MeetingHelper.calendarOf(room, svc, queue);
  const maxMeetings = Math.ceil(conf.maxMeetings * Math.random());
  const randomPart = new Participant('random@random.com');

  return roomMeetingHelper.cleanupMeetings(start, end)
                          .then(() => {
                            const currentDate = moment(start).set('minutes', 0).set('seconds', 0)
                                                             .set('milliseconds', 0);
                            const events: Promise<any>[] = [];
                            let numEvents = 0;

                            while (currentDate.isBefore(end) && numEvents <= maxMeetings) {
                              const duration = random15MinDelay(conf.maxDuration);
                              const subject = createSubject(conf);

                              const eventDate = currentDate.clone();
                              events.push(
                                queue.wrap(() => roomMeetingHelper.createMeeting(subject, eventDate, duration, [randomPart]))()
                                     .catch(err => logger.error(`Failed to create event for ${randomPart.email}`, err))
                              );

                              currentDate.add(conf.maxDuration).add(random15MinDelay(conf.maxDuration));
                              numEvents++;
                            }

                            logger.debug(`Generated ${events.length} random events for ${randomPart.email} on ${currentDate.format(
                              'MMM DD YYYY')}.`);
                            return Promise.all(events);
                          });
}

function createSubject(conf: GeneratorConfig) {
  const topic = randomOf(conf.topics);
  const name = randomOf(conf.names);
  const title = randomOf(conf.titles);

  const res = ('' + title)
    .split('{n}').join(name)
    .split('{t}').join(topic);
  return res;
}

function random15MinDelay(maxDuration: Duration) {
  return moment.duration(15 + Math.floor(Math.random() * maxDuration.asMinutes() / 15) * 15, 'minutes');
}

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
