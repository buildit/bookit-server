import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

/**
 * A caching strategy that uses the meeting's ISO formatted end date.
 */
export class EndDateCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.end.format('YYYYMMDD');
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
