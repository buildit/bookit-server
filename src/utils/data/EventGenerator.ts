import {TaskQueue} from 'cwait';
import {Duration, Moment} from 'moment';
import {AppConfig} from '../../config/config';
import {MeetingsService} from '../../service/MeetingService';
import {RootLog as logger} from '../RootLogger';
import {MeetingHelper} from './MeetingHelper';
import * as moment from 'moment';

export interface GeneratorConfig {
  readonly titles: string[];
  readonly names: string[];
  readonly topics: string[];
  readonly maxDuration: Duration;
  readonly maxEventDelay: Duration;
  readonly hostUser: string;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  titles: ['Inspirational lunch with {n}', 'New {t} stuff from {n}', 'Presentation of {t} by {n} and his friends', 'Sales proposal discussion about {t}'],
  names: ['Alex', 'Zac', 'Nicole', 'Roman', 'Grommit'],
  topics: ['tomatoes', 'rotten tomatoes', 'art house', 'Google', 'Pink Easter Egg', 'Firing Joe'],
  maxDuration: moment.duration(2, 'hours'),
  maxEventDelay: moment.duration(5, 'hours'),
  hostUser: 'romans@myews.onmicrosoft.com'
};

const queue = new TaskQueue(Promise, 7);

export function generateMeetings(svc: MeetingsService,
                                 start: Moment = moment().add(-1, 'day'),
                                 end: Moment = moment().add(1, 'weeks'),
                                 config: GeneratorConfig = DEFAULT_CONFIG): Promise<any> {
  // should config be used instead of AppConfig?
  return Promise.all(AppConfig.roomLists[0].rooms.map(room => regenerateEvents(room.email, start, end, svc, DEFAULT_CONFIG)));
}


function regenerateEvents(email: string, start: Moment, end: Moment, svc: MeetingsService, conf: GeneratorConfig): Promise<any> {
  const meetingHelper = MeetingHelper.calendarOf(conf.hostUser, svc, queue);
  const roomMeetingHelper = MeetingHelper.calendarOf(email, svc, queue);

  return Promise.all([roomMeetingHelper.cleanupMeetings(start, end),
                       meetingHelper.cleanupMeetings(start, end)])
                .then(() => {
                  const currentDate = moment(start).set('minutes', 0).set('seconds', 0).set('milliseconds', 0);
                  const events: Promise<any>[] = [];

                  while (currentDate.isBefore(end)) {
                    const duration = random15MinDelay(conf.maxDuration);
                    const subject = createSubject(conf);

                    const eventDate = currentDate.clone();
                    events.push(queue.wrap(() => meetingHelper.createMeeting(subject, eventDate, duration, [{email}]))()
                                     .then(() => logger.debug(`Created event ${subject} as ${eventDate}`))
                                     .catch(err => logger.error(`Failed to create event for ${email}`, err))
                    );

                    currentDate.add(conf.maxDuration).add(random15MinDelay(conf.maxDuration));
                  }
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
