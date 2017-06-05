import {Meeting} from '../../model/Meeting';
import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';


export class IdCachingStrategy extends IdentityCachingStrategy<Meeting> {
  getKey(item: Meeting): string {
    return item.id;
  }
}
