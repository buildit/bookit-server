import {IdentityCachingStrategy} from '../../utils/cache/IdentityCachingStrategy';
import {MSUser} from '../users/UserService';


export class UserGroupNameCachingStrategy extends IdentityCachingStrategy<MSUser> {
  getKey(item: MSUser): string {
    return item.displayName;
  }
}
