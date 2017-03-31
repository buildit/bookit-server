import {Participant} from './Participant';
export class Meeting {
  id: string;
  title: string;
  location: string;
  participants: Participant[];
  start: Date;
  end: Date;
}
