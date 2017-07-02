import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

export class StartDateCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.start.format('YYYYMMDD');
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
