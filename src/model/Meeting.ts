import {Participant} from './Participant';
export class Meeting {
  title: string;
  location: string;
  participants: Participant[];
  start: Date;
  end: Date;
}
