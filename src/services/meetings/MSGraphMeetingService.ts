import * as moment from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';
import {findById, Meeting} from '../../model/Meeting';
import {MeetingsService} from './MeetingService';
import {MSGraphBase} from '../MSGraphBase';
import {Participant} from '../../model/Participant';
import {Duration, Moment} from 'moment';
import {maybeApply} from '../../utils/collections';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphMeetingService extends MSGraphBase implements MeetingsService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphMeetingService');
  }


  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    const startDateTime = start.toISOString();
    const endDateTime = end.toISOString();
    return this.client
               .api(`/users/${email}/calendar/calendarView`)
               .select('id,subject,organizer,attendees,start,end')
               .query({startDateTime, endDateTime})
               .get()
               .then(response => {
                 // logger.debug('Found meetings for ', email, start, end, response);
                 return response.value.map((meeting: any) => MSGraphMeetingService.mapMeeting(meeting));
               }, err => {
                 console.error(err);
                 return [];
               }) as Promise<Meeting[]>;

  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Participant): Promise<Meeting> {
    const participants = [room];
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

    return this.client.api(`/users/${owner.email}/calendar/events`)
               .post(eventData)
               .then(meeting => MSGraphMeetingService.mapMeeting(meeting)) as Promise<Meeting>;
  }


  findMeeting(email: string, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return this.getMeetings(email, start, end)
               .then(meetings => {
                 const meeting = findById(meetings, meetingId);
                 if (!meeting) {
                   throw new Error('meeting not found');
                 }

                 return meeting;
               });
  }


  deleteMeeting(owner: string, id: string): Promise<any> {
    return this.client.api(`/users/${owner}/calendar/events/${id}`).delete() as Promise<any>;
  }


  private static mapMeeting(meeting: any): Meeting {
    const mapToParticipant = (attendee: any) => {
      return {
        name: attendee.emailAddress.name,
        email: attendee.emailAddress.address
      };
    };

    const participants = maybeApply(meeting.attendees, mapToParticipant);

    return {
      id: meeting.id as string,
      title: meeting.subject as string,
      owner: mapToParticipant(meeting.organizer),
      participants: participants,
      start: moment.utc(meeting.start.dateTime),
      end: moment.utc(meeting.end.dateTime)
    };
  }
}