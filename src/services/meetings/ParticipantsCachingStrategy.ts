import {Meeting} from '../../model/Meeting';

import {MultiListCachingStrategy} from '../../utils/cache/MultiListCachingStrategy';


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
