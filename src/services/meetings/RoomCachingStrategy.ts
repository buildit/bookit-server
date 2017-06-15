import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

export class RoomCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.location.displayName;
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
