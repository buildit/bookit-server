import * as moment from 'moment';
import {Moment} from 'moment';


export function stringToYesterdayStart(str: string) {
  return momentToYesterdayStart(moment(str));
}


export function momentToYesterdayStart(time: Moment) {
  return time.clone().subtract(1, 'day').startOf('day');
}


export function stringToTomorrowEnd(str: string) {
  return momentToTomorrowEnd(moment(str));
}

export function momentToTomorrowEnd(time: Moment) {
  return time.clone().add(1, 'day').endOf('day');
}
