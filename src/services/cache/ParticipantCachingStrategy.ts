import {filterOutMeetingById, Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from './ListCachingStrategy';


// export class ParticipantCachingStrategy implements ListCachingStrategy<Meeting> {
//
//   put(cache: Map<string, Meeting[]>, item: Meeting): Meeting[] {
//     item.participants.forEach(participant => {
//       const key = participant.email;
//       const meetings = cache.get(key);
//       const filtered = filterOutMeetingById(meetings, item);
//       cache.set(key, filtered);
//       console.log('Cached meeting', item.id, 'against', participant.email);
//     });
//
//     return [];
//   }
//
//
//   abstract getKey(item: Type): string;
//
// }
