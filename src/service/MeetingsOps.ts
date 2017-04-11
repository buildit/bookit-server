import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {Participant} from '../model/Participant';
import {Room} from '../model/Room';
import {Meetings} from './Meetings';

export class MeetingsOps {

  constructor(private meetingSvc: Meetings) {
  };

  getRoomListMeetings(rooms: Room[], start: Moment, end: Moment) {
    // FIXME: must use queue!!!
    return Promise.all(
      rooms.map(room =>
        this.meetingSvc.getMeetings(room.email, start, end)
          .then(m => {
            return {room, meetings: m};
          })));
  }

  createEvent(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<any> {
    return new Promise((resolve, reject) => {
      this.checkTimeIsAvailable(room, start, duration)
        .then(isAvailable => {
          if (isAvailable) {
            this.meetingSvc.createEvent(subj, start, duration, owner, room)
              .then((data) => {
                console.log('ARRRR', data);
                resolve(data);
              }, err => {
                console.log('ARRRR', err);
                reject(err);
              });
          } else {
            reject('This time slot is not available.');
          }
        })
        .catch(err => reject(err));
    });
  }

  private checkTimeIsAvailable(calendarOwner: Participant, start: moment.Moment, duration: moment.Duration): Promise<boolean> {
    return this.meetingSvc.getMeetings(calendarOwner.email, start, start.clone().add(duration))
      .then(meetings => {
        const end = start.clone().add(duration);
        const conflicts = meetings.filter(meeting => {
          const condition = !(moment(meeting.start).isAfter(end) || moment(meeting.end).isBefore(start));
          return condition;
        });
        return conflicts.length === 0;
      });
  }

}
