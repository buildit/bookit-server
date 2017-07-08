import {RootLog as logger} from '../RootLogger';

import {ListCachingStrategy} from './ListCachingStrategy';
import {IdentityCachingStrategy} from './IdentityCachingStrategy';
import {SurrogateListCachingStrategy} from './SurrogateListCachingStrategy';


export class IdentityCache<RType> {
  constructor(private cache: Map<string, RType>, private strategy: IdentityCachingStrategy<RType>) {
  }

  put(item: RType) {
    this.strategy.put(this.cache, item);
  }

  get(key: string): RType {
    return this.strategy.get(this.cache, key);
  }

  remove(item: RType) {
    this.strategy.remove(this.cache, item);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  values(): IterableIterator<RType> {
    return this.cache.values();
  }
}


export class ListCache<RType> {
  constructor(private cache: Map<string, Map<string, RType>>, private strategy: ListCachingStrategy<RType>) {
  }

  put(item: RType) {
    this.strategy.put(this.cache, item);
  }

  get(key: string): RType[] {
    return this.strategy.get(this.cache, key);
  }

  remove(item: RType) {
    this.strategy.remove(this.cache, item);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}


export class SurrogateListCache<KType, RType> {
  constructor(private cache: Map<string, Map<string, RType>>,
              private strategy: SurrogateListCachingStrategy<KType, RType>) {
  }

  put(surrogate: KType, item: RType) {
    this.strategy.put(this.cache, surrogate, item);
    console.info('Surrogate', this.cache.keys());
  }


  get(key: KType): RType[] {
    return this.strategy.get(this.cache, key);
  }


  remove(surrogate: KType, item: RType) {
    this.strategy.remove(this.cache, surrogate, item);
  }


  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}


