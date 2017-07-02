import {RootLog as logger} from '../RootLogger';

import {CachingStrategy} from './CachingStrategy';

export abstract class ListCachingStrategy<Type> implements CachingStrategy<Type, Type[], Type[]> {


  abstract getKey(item: Type): string;


  abstract getIdentityMapper(item: Type): string;


  hasKey(cache: Map<string, Type[]>, key: string): boolean {
    return cache.has(key);
  }


  put(cache: Map<string, Type[]>, toCache: Type): Type[] {
    const key = this.getKey(toCache);
    return this.putKey(cache, key, toCache);
  }

  get(cache: Map<string, Type[]>, key: string): Type[] {
    return cache.get(key);
  }


  remove(cache: Map<string, Type[]>, item: Type): boolean {
    const key = this.getKey(item);
    logger.info('Will remove by key', key);
    return this.removeKey(cache, key, item);
  }


  putKey(cache: Map<string, Type[]>, key: string, toCache: Type): Type[] {
    logger.trace('Putting key', key, 'identity', this.getIdentityMapper(toCache));
    const existing = cache.get(key);
    if (!existing) {
      const list = [toCache];
      cache.set(key, list);
      logger.trace('New list for key', key, list.length);
      return list;
    }

    if (existing.length) {
      logger.trace('Existing list', key, 'size', existing.length);
      const found = existing.some(item => { return this.areIdentical(item, toCache); });
      if (found) {
        return existing;
      }
    }

    existing.push(toCache);
    logger.trace('Adding to list', key, 'size', existing.length);

    return existing;
  }


  removeKey(cache: Map<string, Type[]>, key: string, toRemove: Type): boolean {
    logger.trace('Removing key', key, 'identity', this.getIdentityMapper(toRemove));
    const existing = cache.get(key);
    if (!existing) {
      console.trace('Unable to find key to remove', key);
      return false;
    }

    const filtered = existing.filter(some => { return !this.areIdentical(some, toRemove); });
    if (filtered.length) {
      logger.trace('Filtered key', key, 'to list size', filtered.length);
      cache.set(key, filtered);
      return true;
    }

    logger.trace('Filtered key', key, 'to list zero');
    cache.delete(key);
    return true;
  }



  areIdentical(some: Type, other: Type) {
    return this.getIdentityMapper(some) === this.getIdentityMapper(other);
  }
}
