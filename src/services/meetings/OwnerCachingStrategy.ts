import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

/**
 * A caching strategy using the meeting owner's email.
 */
export class OwnerCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.owner.email;
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
