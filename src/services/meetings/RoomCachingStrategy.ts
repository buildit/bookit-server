import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

/**
 * A caching strategy that uses the meeting's location name
 */
export class RoomCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.location.displayName;
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
