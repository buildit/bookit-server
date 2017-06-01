import {CachingStrategy} from './CachingStrategy';
import {Meeting} from '../../model/Meeting';
import {filterOutMeetingById} from '../meetings/MeetingsOps';

export class ParticipantCachingStrategy implements CachingStrategy<Meeting> {

  put(cache: Map<string, Meeting[]>, item: Meeting): void {
    item.participants.forEach(participant => {
      const key = participant.email;
      const meetings = cache.get(key);
      filterOutMeetingById(meetings, item);
    });
  }

  get(cache: Map<string, Meeting>, item: Meeting): void {
    throw new Error('Method not implemented.');
  }

  computeKey(item: Meeting): string {
    throw new Error('Method not implemented.');
  }

}
