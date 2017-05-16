import {Participant} from './Participant';
import * as moment from 'moment';

export class Meeting {
  id: string;
  title: string;
  location?: string;
  owner: Participant;
  participants: Participant[];
  start: moment.Moment;
  end: moment.Moment;
}
