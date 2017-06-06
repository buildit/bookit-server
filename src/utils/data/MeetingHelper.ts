import * as assert from 'assert';
import {TaskQueue} from 'cwait';
import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {MeetingsService} from '../../services/meetings/MeetingService';

export class MeetingHelper {

  private constructor(public owner: Participant,
                      private meetingsSvc: MeetingsService,
                      private queue: TaskQueue<Promise<any>>) {
  }


  static calendarOf(owner: Participant | string,
                    meetings: MeetingsService,
                    queue: TaskQueue<Promise<any>> = new TaskQueue(Promise, 3)): MeetingHelper {
    if (typeof owner === 'string') {
      return new MeetingHelper({email: owner, name: owner.split('@')[0]}, meetings, queue);
    }
    return new MeetingHelper(owner, meetings, queue);
  }


  getMeetings(start: Moment, end: Moment): Promise<Meeting[]> {
    return this.meetingsSvc.getMeetings(this.owner.email, start, end);
  }


  cleanupMeetings(start: Moment, end: Moment): Promise<any> {
    const wrapDelete = (m: Meeting) => {
      return this.queue.wrap(() => this.deleteMeeting(m.id))();
    };

    /* I'm not sure what this is really accomplishing */
    return this.getMeetings(start, end)
               .then(meetings => {
                 const meetPromises = meetings.map(m => wrapDelete(m).then(() => {})
                                                                     .catch(err => {
                                                                       console.error('Failed to delete ', err);
                                                                       return;
                                                                     }));

                 return Promise.all(meetPromises);
               });
  }


  createMeeting(subj: string = '', start: Moment = moment(), duration: Duration = moment.duration(1, 'hour'), participants: Participant[] = []): Promise<any> {
    assert(participants.length === 1);
    return this.meetingsSvc.createMeeting(subj, start, duration, this.owner, participants[0]);
  }

  deleteMeeting(id: string): Promise<any> {
    return this.meetingsSvc.deleteMeeting(this.owner.email, id);
  }
}
