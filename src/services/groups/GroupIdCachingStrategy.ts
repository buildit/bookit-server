import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';
import {MSGroup} from './GroupService';


export class GroupIdCachingStrategy extends IdentityCachingStrategy<MSGroup> {
  getKey(item: MSGroup): string {
    return item.id;
  }
}
