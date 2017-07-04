import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

/**
 * A caching strategy that uses the meeting's ISO formatted start date
 */
export class StartDateCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.start.format('YYYYMMDD');
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
