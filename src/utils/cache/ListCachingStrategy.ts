import {RootLog as logger} from '../RootLogger';

import {CachingStrategy} from './CachingStrategy';

/**
 * An abstract implementation of a list mapping strategy.  That is, a strategy that will have multiple
 * values per key.  The store here is a map of key to a list of the stored type.
 *
 * This is useful for example when caching the meetings by owner.  Each owner will almost certainly have
 * multiple meetings, definitely the case when the meeting owner is a room.
 */
export abstract class ListCachingStrategy<Type> implements CachingStrategy<Type, Map<string, Type>, Type[]> {

  abstract getKey(item: Type): string;


  abstract getIdentityMapper(item: Type): string;


  hasKey(cache: Map<string, Map<string, Type>>, key: string): boolean {
    return cache.has(key);
  }


  put(cache: Map<string, Map<string, Type>>, toCache: Type): Type[] {
    const key = this.getKey(toCache);
    return this.putKey(cache, key, toCache);
  }


  get(cache: Map<string, Map<string, Type>>, key: string): Type[] {
    const subCache = cache.get(key);
    if (!subCache) {
      return [];
    }

    return Array.from(subCache.values());
  }


  remove(cache: Map<string, Map<string, Type>>, item: Type): boolean {
    const key = this.getKey(item);
    return this.removeKey(cache, key, item);
  }


  putKey(cache: Map<string, Map<string, Type>>, key: string, toCache: Type): Type[] {
    const createNewCache = (): Map<string, Type> => {
      const subCache = new Map<string, Type>();
      cache.set(key, subCache);
      return subCache;
    };

    const subCache = cache.get(key) || createNewCache();
    const identity = this.getIdentityMapper(toCache);
    subCache.set(identity, toCache);

    logger.trace('Putting key', key, 'identity', identity, 'size', subCache.size);

    return Array.from(subCache.values());
  }


  removeKey(cache: Map<string, Map<string, Type>>, key: string, toRemove: Type): boolean {
    logger.trace('Removing key', key, 'identity', this.getIdentityMapper(toRemove));
    const subCache = cache.get(key);
    if (!subCache) {
      logger.trace('Unable to find key to remove', key);
      return false;
    }

    const identity = this.getIdentityMapper(toRemove);
    return subCache.delete(identity);
  }
}
