import {Duration, Moment} from 'moment';
import moment = require('moment');
import {CloudMeetings} from '../../src/service/cloud/CloudMeetings';
import {CloudBase} from '../../src/service/cloud/CloudBase';
import {AppConfig} from '../../src/config/config';
import {Meeting} from '../../src/model/Meeting';

export class MeetingHelper extends CloudBase {

  private meetingsSvc = new CloudMeetings(AppConfig.graphApi);

  private constructor(private email: string) {
    super(AppConfig.graphApi);
  }

  static calendarOf(email: string): MeetingHelper {
    return new MeetingHelper(email);
  }

  getMeetings(start: Moment, end: Moment): Promise<Meeting[]> {
    return this.meetingsSvc.getMeetings(this.email, start, end);
  }

  cleanupMeetings(start: Moment, end: Moment): Promise<void> {
    return this.getMeetings(start, end).then(meetings => {
      return Promise.all(meetings.map(m => this.deleteEvent(m.id)))
        .then(() => {
          return;
        })
        .catch(() => {
          //todo: should catch 404 only
          return;
        });
    });
  }

  createRawEvent(obj: any): Promise<any> {
    return this.client.api(`/users/${this.email}/calendar/events`).post(obj) as Promise<any>;
  }

  createEvent(subj: string = '', start: Moment = moment(), duration: Duration = moment.duration(1, 'hour')): Promise<any> {
    //todo: map participants
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
      attendees: [] as any[],
    };
    return this.client.api(`/users/${this.email}/calendar/events`).post(eventData) as Promise<any>;
  }

  deleteEvent(id: string): Promise<any> {
    return this.client.api(`/users/${this.email}/calendar/events/${id}`).delete() as Promise<any>;
  }
}
