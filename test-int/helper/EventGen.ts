import moment = require('moment');
import {AppConfig} from '../../src/config/config';
import {MeetingHelper} from './MeetingHelper';
const start = moment().add(1, 'day');
const subject = 'helper made!!';

console.log(JSON.stringify(AppConfig));

Promise.all(AppConfig.roomLists[0].rooms
  .map(room => MeetingHelper.calendarOf(room.email).createEvent(subject, start, moment.duration(1, 'hour'))));
