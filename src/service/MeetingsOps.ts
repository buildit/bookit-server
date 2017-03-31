import {Room} from '../model/Room';
import {Meetings} from './Meetings';
import {Moment} from 'moment';
import {Meeting} from '../model/Meeting';

export class MeetingsOps {

  constructor(private meetingSvc: Meetings) {
  };

  getRoomListMeetings(rooms: Room[], start: Moment, end: Moment) {
    return Promise.all(
      rooms.map(room =>
        this.meetingSvc.getMeetings(room.email, start, end)
          .then(m => {
            return {room, meetings: m};
          })));
  }
}
