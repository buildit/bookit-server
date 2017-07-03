import {ListCachingStrategy} from './ListCachingStrategy';
import {IdentityCachingStrategy} from './IdentityCachingStrategy';


export class IdentityCache<RType> {
  constructor(private cache: Map<string, RType>, private strategy: IdentityCachingStrategy<RType>) {
  }

  put(meeting: RType) {
    this.strategy.put(this.cache, meeting);
  }

  get(key: string): RType {
    return this.strategy.get(this.cache, key);
  }

  remove(meeting: RType) {
    this.strategy.remove(this.cache, meeting);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}


export class ListCache<RType> {
  constructor(private cache: Map<string, RType[]>, private strategy: ListCachingStrategy<RType>) {
  }

  put(meeting: RType) {
    this.strategy.put(this.cache, meeting);
  }

  get(key: string): RType[] {
    return this.strategy.get(this.cache, key);
  }

  remove(meeting: RType) {
    this.strategy.remove(this.cache, meeting);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}



