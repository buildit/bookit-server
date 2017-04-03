import {Duration, Moment} from 'moment';
import moment = require('moment');
import {CloudBase} from '../../service/cloud/CloudBase';
import {CloudMeetings} from '../../service/cloud/CloudMeetings';
import {AppConfig} from '../../config/config';
import {Meeting} from '../../model/Meeting';
import {TaskQueue} from 'cwait';
import {Participant} from '../../model/Participant';

export class MeetingHelper extends CloudBase {

  private meetingsSvc = new CloudMeetings(AppConfig.graphApi);

  private constructor(private email: string, private queue: TaskQueue<Promise<any>>) {
    super(AppConfig.graphApi);
  }

  static calendarOf(email: string, queue: TaskQueue<Promise<any>> = new TaskQueue(Promise, 3)): MeetingHelper {
    return new MeetingHelper(email, queue);
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
          //todo: should catch 404 only
          return;
        })));
    });
  }

  createRawEvent(obj: any): Promise<any> {
    return this.client.api(`/users/${this.email}/calendar/events`).post(obj) as Promise<any>;
  }

  createEvent(subj: string = '', start: Moment = moment(), duration: Duration = moment.duration(1, 'hour'), participants: Participant[] = []): Promise<any> {

    const attendees = participants.map(participant => (
      {
        type: 'required',
        emailAddress: {
          name: participant.name,
          address: participant.email
        }
      }
    ));

    const eventData = {
      originalStartTimeZone: 'UTC',
      originalEndTimeZone: 'UTC',
      subject: subj,
      sensitivity: 'normal',
      isAllDay: false,
      responseRequested: true,
      showAs: 'busy',
      type: 'singleInstance',
      body: {contentType: 'text', content: 'hello from helper'},
      start: {dateTime: moment.utc(start), timeZone: 'UTC'},
      end: {dateTime: moment.utc(start.clone().add(duration)), timeZone: 'UTC'},
      location: {displayName: 'helper', address: {}},
      attendees,
    };
    console.log(JSON.stringify(eventData));
    return this.client.api(`/users/${this.email}/calendar/events`).post(eventData) as Promise<any>;
  }

  deleteEvent(id: string): Promise<any> {
    return this.client.api(`/users/${this.email}/calendar/events/${id}`).delete() as Promise<any>;
  }
}
