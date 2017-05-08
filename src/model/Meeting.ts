import {Participant} from './Participant';

export class Meeting {
  id: string;
  title: string;
  location?: string;
  owner: Participant;
  participants: Participant[];
  start: Date;
  end: Date;
}
