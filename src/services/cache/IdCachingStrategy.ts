import {CachingStrategy} from './CachingStrategy';
import {Meeting} from '../../model/Meeting';


export class IdCachingStrategy implements CachingStrategy<Meeting> {

  put(cache: Map<string, Meeting>, item: Meeting): Meeting {
    const key = item.id;
    cache.set(key, item);
    return item;
  }

  get(cache: Map<string, Meeting>, key: string): Meeting {
    return cache.get(key);
  }

}
