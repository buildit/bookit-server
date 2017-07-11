import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';
import {MSGroup} from './GroupService';


export class GroupNameCachingStrategy extends IdentityCachingStrategy<MSGroup> {
  getKey(item: MSGroup): string {
    return item.displayName;
  }
}
