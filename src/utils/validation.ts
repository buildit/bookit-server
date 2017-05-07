import * as moment from 'moment';


// TODO: Replace this with express typings
export interface Request {
  param: (paramName: string) => string;
}


export const extractAsMoment = (req: Request, param: string) => {
  const startParam = req.param(param);
  return moment(startParam);
};


export const isMomentBetween = (meetStart: moment.Moment, meetEnd: moment.Moment,
                                start: moment.Moment, end: moment.Moment) => {
  return !moment(meetStart).isAfter(end) && !moment(meetEnd).isBefore(start);

  // return !(moment(meetStart).isAfter(end) || moment(meetEnd).isBefore(start));
};
