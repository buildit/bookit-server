import {RootLog as logger} from '../RootLogger';

import {CachingStrategy, SurrogateCachingStrategy} from './CachingStrategy';

/**
 * An abstract implementation of a list mapping strategy with a surrogate key provider.  That is, a strategy
 * that will have multiple values per key but based on another object.
 *
 * This is useful for example when caching group members by a group id.
 */
export abstract class SurrogateListCachingStrategy<Surrogate, Type> implements SurrogateCachingStrategy<Surrogate, Type, Map<string, Type>, Type[]> {


  abstract getKey(surrogate: Surrogate): string;


  abstract getIdentityMapper(item: Type): string;


  hasSurrogateKey(cache: Map<string, Map<string, Type>>, surrogate: Surrogate): boolean {
    const key = this.getKey(surrogate);
    return cache.has(key);
  }


  put(cache: Map<string, Map<string, Type>>, surrogate: Surrogate, toCache: Type): Type[] {
    const key = this.getKey(surrogate);
    return this.putKey(cache, key, toCache);
  }


  get(cache: Map<string, Map<string, Type>>, surrogate: Surrogate): Type[] {
    const key = this.getKey(surrogate);
    const subCache = cache.get(key);
    if (!subCache) {
      return [];
    }

    return Array.from(subCache.values());
  }


  removeSurrogate(cache: Map<string, Map<string, Type>>, surrogate: Surrogate): boolean {
    const key = this.getKey(surrogate);
    return cache.delete(key);
  }


  remove(cache: Map<string, Map<string, Type>>, surrogate: Surrogate, item: Type): boolean {
    const key = this.getKey(surrogate);
    return this.removeKey(cache, key, item);
  }


  protected putKey(cache: Map<string, Map<string, Type>>, key: string, toCache: Type): Type[] {
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


  protected removeKey(cache: Map<string, Map<string, Type>>, key: string, toRemove: Type): boolean {
    logger.trace('Removing key', key, 'identity', this.getIdentityMapper(toRemove));
    const subCache = cache.get(key);
    if (!subCache) {
      console.trace('Unable to find key to remove', key);
      return false;
    }

    const identity = this.getIdentityMapper(toRemove);
    return subCache.delete(identity);
  }
}
