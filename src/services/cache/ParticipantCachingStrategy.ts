import {CachingStrategy} from './CachingStrategy';
import {Meeting} from '../../model/Meeting';

export class ParticipantCachingStrategy implements CachingStrategy<Meeting> {
  put(cache: Map<string, Meeting>, item: Meeting): void {
    throw new Error('Method not implemented.');
  }

  get(cache: Map<string, Meeting>, item: Meeting): void {
    throw new Error('Method not implemented.');
  }

  computeKey(item: Meeting): string {
    throw new Error('Method not implemented.');
  }

}
