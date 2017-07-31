import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';
import {MSUser} from '../../model/MSUser';


export class UserGroupNameCachingStrategy extends IdentityCachingStrategy<MSUser> {
  getKey(item: MSUser): string {
    return item.displayName;
  }
}
