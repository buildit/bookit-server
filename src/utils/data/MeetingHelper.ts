import * as assert from 'assert';
import {TaskQueue} from 'cwait';
import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {AppConfig} from '../../config/config';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {CloudBase} from '../../service/cloud/CloudBase';
import {Meetings} from '../../service/Meetings';

export class MeetingHelper extends CloudBase {

  private constructor(private email: string, private meetingsSvc: Meetings, private queue: TaskQueue<Promise<any>>) {
    super(AppConfig.graphApi);
  }

  static calendarOf(email: string, meetings: Meetings, queue: TaskQueue<Promise<any>> = new TaskQueue(Promise, 3)): MeetingHelper {
    return new MeetingHelper(email, meetings, queue);
  }

  getMeetings(start: Moment, end: Moment): Promise<Meeting[]> {
    return this.meetingsSvc.getMeetings(this.email, start, end);
  }

  cleanupMeetings(start: Moment, end: Moment): Promise<any> {
    return this.getMeetings(start, end).then(meetings => {
      return Promise.all(meetings.map(m => this.queue.wrap(() => this.deleteEvent(m.id))()
        .then(() => {
          return;
        })
        .catch(() => {
          // todo: should catch 404 only
          return;
        })));
    });
  }

  createRawEvent(obj: any): Promise<any> {
    return this.client.api(`/users/${this.email}/calendar/events`).post(obj) as Promise<any>;
  }

  createEvent(subj: string = '', start: Moment = moment(), duration: Duration = moment.duration(1, 'hour'), participants: Participant[] = []): Promise<any> {
    assert(participants.length === 1);
    return this.meetingsSvc.createEvent(subj, start, duration, {name: 'no used', email: this.email}, participants[0]);
  }

  deleteEvent(id: string): Promise<any> {
    return this.meetingsSvc.deleteEvent(this.email, id);
  }
}
