import {Meeting} from '../../model/Meeting';

import {ListCachingStrategy} from './ListCachingStrategy';

export class OwnerCachingStrategy extends ListCachingStrategy<Meeting> {

  getKey(item: Meeting): string {
    return item.owner.email;
  }

  getIdentityMapper(item: Meeting) {
    return item.id;
  }

}
