import * as assert from 'assert';
import {TaskQueue} from 'cwait';
import * as moment from 'moment';
import {Duration, Moment} from 'moment';
import {Meeting} from '../../model/Meeting';
import {Participant} from '../../model/Participant';
import {MeetingsService} from '../../services/meetings/MeetingService';
import {Room} from '../../model/Room';

/**
 * We should try to get rid of this stuff
 */
export class MeetingHelper {

  private constructor(private room: Room,
                      private meetingsSvc: MeetingsService,
                      private queue: TaskQueue<Promise<any>>) {
  }


  static calendarOf(room: Room,
                    meetings: MeetingsService,
                    queue: TaskQueue<Promise<any>> = new TaskQueue(Promise, 3)): MeetingHelper {
    return new MeetingHelper(room, meetings, queue);
  }


  getMeetings(start: Moment, end: Moment): Promise<Meeting[]> {
    return this.meetingsSvc.getMeetings(this.room, start, end);
  }


  cleanupMeetings(start: Moment, end: Moment): Promise<any> {
    const wrapDelete = (m: Meeting) => {
      return this.queue.wrap(() => this.deleteUserMeeting(m.owner, m.id))();
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
    return this.meetingsSvc.createUserMeeting(subj, start, duration, this.room, participants[0]);
  }


  private deleteUserMeeting(owner: Participant, id: string): Promise<any> {
    return this.meetingsSvc.deleteUserMeeting(owner, id);
  }
}
