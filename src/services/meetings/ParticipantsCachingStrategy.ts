import {Meeting} from '../../model/Meeting';

import {MultiListCachingStrategy} from '../../utils/cache/MultiListCachingStrategy';

/**
 * A caching strategy using the meeting's participants.
 */
export class ParticipantsCachingStrategy extends MultiListCachingStrategy<Meeting> {

  getKeys(item: Meeting): string[] {
    const mailSet = new Set<string>();
    item.participants.forEach(participant => mailSet.add(participant.email));
    mailSet.add(item.owner.email);

    return Array.from(mailSet);
  }

  getIdentityMapper(item: Meeting): string {
    return item.id;
  }

}
