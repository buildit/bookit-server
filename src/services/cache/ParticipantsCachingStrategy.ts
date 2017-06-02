import {Meeting} from '../../model/Meeting';

import {MultiListCachingStrategy} from './MultiListCachingStrategy';


export class ParticipantsCachingStrategy extends MultiListCachingStrategy<Meeting> {

  getKeys(item: Meeting): string[] {
    const participantKeys = item.participants.map(participant => participant.email);
    participantKeys.push(item.owner.email);

    return participantKeys;
  }

  getIdentityMapper(item: Meeting): string {
    return item.id;
  }

}
