import * as moment from 'moment';


// TODO: Replace this with express typings
export interface Request {
  param: (paramName: string) => string;
}


export const extractAsMoment = (req: Request, param: string) => {
  const startParam = req.param('start');
  return moment(startParam);
};
