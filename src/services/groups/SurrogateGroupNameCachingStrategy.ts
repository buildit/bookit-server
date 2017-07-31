import {MSUser} from '../../model/MSUser';
import {MSGroup} from './GroupService';
import {SurrogateListCachingStrategy} from '../../utils/cache/SurrogateListCachingStrategy';


export class SurrogateGroupNameCachingStrategy extends SurrogateListCachingStrategy<MSGroup, MSUser> {
  getKey(item: MSGroup): string {
    return item.id;
  }


  getIdentityMapper(item: MSUser): string {
    return item.id;
  }
}
