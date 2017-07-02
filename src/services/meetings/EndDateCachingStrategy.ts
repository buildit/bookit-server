import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from '../../utils/cache/ListCachingStrategy';

export class EndDateCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.end.format('YYYYMMDD');
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
