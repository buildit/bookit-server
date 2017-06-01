import * as moment from 'moment';
import {Meeting} from '../model/Meeting';
import {Moment} from 'moment';


// TODO: Replace this with express typings
export interface Request {
  param: (paramName: string) => string;
}


export const extractAsMoment = (req: Request, param: string) => {
  const startParam = req.param(param);
  return moment(startParam);
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
  return meetingStart.isAfter(start) && meetingEnd.isBefore(end);
};


export function invokeIfUnset<T>(item: T, factoryMethod: () => T) {
  if (item) {
    return item;
  }

  return factoryMethod();
}
