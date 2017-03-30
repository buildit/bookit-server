import * as moment from 'moment';
import {Meeting} from '../../model/Meeting';
import {Meetings} from '../Meetings';
import {CloudBase} from './CloudBase';
import {Participant} from '../../model/Participant';


export class CloudMeetings extends CloudBase implements Meetings {
  getMeetings(email: string, start: Date, end: Date): Promise<Meeting[]> {

    return this.client
      .api(`/users/${email}/calendar/calendarView`)
      .query({startDateTime: '2016-11-08T19:00:00.0000000', endDateTime: '2018-11-08T19:00:00.0000000'})
      .get()
      .then(response => {
        return response.value.map((meeting: any) => this.mapMeeting(meeting));
      }) as Promise<Meeting[]>;
  }

  private mapMeeting(meeting: any): Meeting {
// todo: TZ
    const start = moment(meeting.start).toDate();
    const end = moment(meeting.end).toDate();
    let participants: Participant[] = [];
    if (meeting.attendees) {
      participants = meeting.attendees.map((attendee: any) => {
        console.log(attendee);
        return {
          name: attendee.emailAddress.name,
          email: attendee.emailAddress.email
        };
      });
    }
    return {title: meeting.subject, location: meeting.location.displayName, participants, start, end};
  }
}

