import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';
import {findById, Meeting} from '../../model/Meeting';
import {Room} from '../../model/Room';
import {MeetingsService} from './MeetingService';
import {MSGraphBase} from '../MSGraphBase';
import {Participant} from '../../model/Participant';
import {maybeApply} from '../../utils/collections';
import {GraphTokenProvider} from '../tokens/TokenProviders';


export class MSGraphMeetingService extends MSGraphBase implements MeetingsService {
  domain(): string {
    return this.tokenOperations.domain();
  }

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphMeetingService');
  }


  clearCaches() {
    return true;
  }

  getMeetings(room: Room, start: Moment, end: Moment): Promise<Meeting[]> {
    return this._getMeetings(room.email, start, end);
  }


  getUserMeetings(user: Participant, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    return this._getMeetings(user.email, start, end);
  }


  createMeeting(subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    const eventData = MSGraphMeetingService._generateEventPayload(subj, start, duration, owner, room);

    const URL = `https://graph.microsoft.com/v1.0/users/${owner.email}/calendar/events`;
    console.info('POST', URL, eventData);

    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.post(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .send(eventData)
                   .end((error, response) => {
                     if (error) {
                       reject(new Error(error));
                       return;
                     }

                     resolve(MSGraphMeetingService._mapMeeting(response.body));
                   });
          });
    });
  }


  updateMeeting(id: string, subj: string, start: Moment, duration: Duration, owner: Participant, room: Room): Promise<Meeting> {
    const eventData = MSGraphMeetingService._generateEventPayload(subj,
                                                                  start,
                                                                  moment.duration(1, 'minute'),
                                                                  owner,
                                                                  room,
                                                                  id);

    const URL = `https://graph.microsoft.com/v1.0/users/${owner.email}/calendar/events/${id}`;
    console.info('PATCH', URL, eventData);

    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.patch(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .send(eventData)
                   .end((error, response) => {
                     if (error) {
                       reject(new Error(error));
                       return;
                     }

                     resolve(MSGraphMeetingService._mapMeeting(response.body));
                   });
          });
    });

  }


  findMeeting(room: Room, meetingId: string, start: Moment, end: Moment): Promise<Meeting> {
    return this.getMeetings(room, start, end)
               .then(meetings => {
                 const meeting = findById(meetings, meetingId);
                 if (!meeting) {
                   throw new Error('meeting not found');
                 }

                 return meeting;
               });
  }


  deleteMeeting(owner: Participant, id: string): Promise<any> {
    return this._deleteMeeting(owner, id);
  }


  doSomeShiznit(test: any): Promise<any> {
    return Promise.reject('Error');
  }


  private _getMeetings(user: string, start: moment.Moment, end: moment.Moment): Promise<Meeting[]> {
    const startDateTime = start.toISOString();
    const endDateTime = end.toISOString();

    const URL = 'https://graph.microsoft.com/v1.0/users/' + user + '/calendar/calendarView';
    logger.info('MSGraphMeetingService::_getMeetings() - ', URL, startDateTime, endDateTime);
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.get(URL)
                   .set('Authorization', `Bearer ${token}`)
                   .query({startDateTime, endDateTime})
                   .end((error, response) => {
                     if (error) {
                       return reject(new Error(error));
                     }

                     // logger.info('Response', response);
                     const meetings = response.body.value.map((meeting: any) => MSGraphMeetingService._mapMeeting(meeting));
                     resolve(meetings);
                   });
          });
    });
  }


  private static _generateEventPayload(subj: string,
                                       start: Moment,
                                       duration: Duration,
                                       owner: Participant,
                                       room: Room,
                                       id?: string): any {
    const participants = [room];
    const attendees = participants.map(MSGraphMeetingService._mapToRequiredEmailAddress);

    return {
      id: id,
      originalStartTimeZone: 'UTC',
      originalEndTimeZone: 'UTC',
      subject: subj,
      sensitivity: 'normal',
      isAllDay: false,
      responseRequested: true,
      showAs: 'busy',
      type: 'singleInstance',
      isOrganizer: true,
      body: {contentType: 'text', content: 'This meeting was auto-generated by BookIt'},
      start: {dateTime: moment.utc(start), timeZone: 'UTC'},
      end: {dateTime: moment.utc(start.clone().add(duration)), timeZone: 'UTC'},
      location: {displayName: room.name, address: {}},
      organizer: MSGraphMeetingService._mapToEmailAddress(owner),
      attendees
    };

  }

  /*
  The various cancels/declines/etc will be promoted to proper calls in the interface.  Also, we will be gutting
  the client.api stuff
   */
  private _cancelMeeting(owner: Participant, id: string): Promise<any> {
    const URL = `/users/${owner.email}/calendar/events/${id}/cancel`;
    console.info('BOOK IT CANCEL', URL);
    return this.client
               .api(URL)
               .post({'Comment': 'BookIt canceling meeting'})
               .then((result) => {
                 logger.info('API Returned!!!!!!@@@@@@@@@@############$$$$$$$$$$$$', result);
                 return result;
               }) as Promise<any>;
  }


  private _cancelViaUpdate(owner: Participant, id: string): Promise<any> {
    const URL = `/users/${owner.email}/calendar/events/${id}/update`;
    console.info('BOOK IT CANCEL', URL);
    return this.client
               .api(URL)
               .patch({'Comment': 'BookIt canceling meeting'})
               .then((result) => {
                 logger.info('API Returned!!!!!!@@@@@@@@@@############$$$$$$$$$$$$', result);
                 return result;
               }) as Promise<any>;
  }


  private _declineMeeting(owner: Participant, id: string): Promise<any> {
    const URL = `/users/${owner.email}/calendar/events/${id}/decline`;
    console.info('BOOK IT DECLINE', URL);
    return this.client
               .api(URL)
               .post({'sendResponse': true})
               .then((result) => {
                 logger.info('API Returned!!!!!!@@@@@@@@@@############$$$$$$$$$$$$', result);
                 return result;
               }) as Promise<any>;
  }


  private _deleteMeeting(owner: Participant, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.tokenOperations.withToken()
          .then(token => {
            request.delete('https://graph.microsoft.com/v1.0/users/' + owner.email + '/calendar/events/' + id)
                   .set('Authorization', `Bearer ${token}`)
                   .end((error, response) => {
                     if (error) {
                       reject(new Error(error));
                     }
                     resolve('Deleted the event');
                   });
          });
    });
  }


  private static _mapToEmailAddress(participant: Participant): any {
    return {
      emailAddress: {
        name: participant.name,
        address: participant.email
      }
    };
  };


  private static _mapToRequiredEmailAddress(participant: Participant) {
    const emailAddress = MSGraphMeetingService._mapToEmailAddress(participant);
    emailAddress.type = 'required';

    return emailAddress;
  };


  private static _mapMeeting(meeting: any): Meeting {
    const mapToParticipant = (attendee: any) => {
      return new Participant(attendee.emailAddress.address, attendee.emailAddress.name);
    };

    // logger.debug('Source meeting', meeting);
    logger.debug('Meeting attendee', meeting.attendees);
    logger.debug('Meeting location', meeting.location);

    const participants = maybeApply(meeting.attendees, mapToParticipant);

    const mappedMeeting = {
      id: meeting.id as string,
      title: meeting.subject as string,
      owner: mapToParticipant(meeting.organizer),
      location: meeting.location,
      participants: participants,
      start: moment.utc(meeting.start.dateTime),
      end: moment.utc(meeting.end.dateTime)
    };

    // logger.debug('MSGraphMeetingService::mapMeeting', mappedMeeting);
    return mappedMeeting;
  }
}
