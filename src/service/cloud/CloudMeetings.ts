import * as moment from 'moment';
import {Meeting} from '../../model/Meeting';
import {Meetings} from '../Meetings';
import {CloudBase} from './CloudBase';
import {Participant} from '../../model/Participant';
import {Moment} from 'moment';


export class CloudMeetings extends CloudBase implements Meetings {

  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    const startDateTime = start.toISOString();
    const endDateTime = end.toISOString();
    return this.client
      .api(`/users/${email}/calendar/calendarView`)
      .query({startDateTime, endDateTime})
      .get()
      .then(response => response.value.map((meeting: any) => this.mapMeeting(meeting)))
      // todo: fix me please!!!!!!!
      .catch(err => []) as Promise<Meeting[]>;
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
    return {
      id: meeting.id as string,
      title: meeting.subject as string,
      location: meeting.location.displayName as string,
      participants, start, end
    };
  }
}

