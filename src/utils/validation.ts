import * as moment from 'moment';
import {Moment} from 'moment';
import {Request} from 'express';

import {Meeting} from '../model/Meeting';
import {RootLog as logger} from './RootLogger';


export const extractQueryParamAsMoment = (req: Request, param: string) => {
  const paramValue = req.query[param];
  if (paramValue) {
    return moment(paramValue);
  }

  throw new Error(`Required param ${param} is missing`);
};


export const isMeetingOverlapping = (existingMeetingStart: moment.Moment, existingMeetingEnd: moment.Moment,
                                     newMeetingStart: moment.Moment, newMeetingEnd: moment.Moment) => {
  const isStartBetween = () => isMomentBetween(newMeetingStart, existingMeetingStart, existingMeetingEnd);
  const isEndBetween = () => isMomentBetween(newMeetingEnd, existingMeetingStart, existingMeetingEnd);
  const isSurroundedBy = () => isMomentWithinRange(existingMeetingStart, existingMeetingEnd, newMeetingStart, newMeetingEnd);

  return [isStartBetween, isEndBetween, isSurroundedBy].some(func => { return func(); });
};


const isMomentBetween = (momentToCheck: moment.Moment, start: moment.Moment, end: moment.Moment) =>
  (momentToCheck.isAfter(start)) && (momentToCheck.isBefore(end));


export const isMeetingWithinRange = (meeting: Meeting, start: Moment, end: Moment) => {
  return isMomentWithinRange(moment(meeting.start), moment(meeting.end), start, end);
};


export const isMomentWithinRange = (meetingStart: moment.Moment, meetingEnd: moment.Moment, start: moment.Moment, end: moment.Moment) => {
  return meetingStart.isSameOrAfter(start) && meetingEnd.isSameOrBefore(end);
};


export function invokeIfUnset<T>(item: T, factoryMethod: () => T) {
  if (item) {
    return item;
  }

  return factoryMethod();
}
