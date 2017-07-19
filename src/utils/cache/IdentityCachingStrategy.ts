import {CachingStrategy} from './CachingStrategy';

/**
 * An abstract implementation of an identity map caching strategy.  In essence, a strategy suitable for a simple
 * hash map.
 *
 * The use case here is when caching meetings by meeting id.  The meeting id should map to the Meeting itself.
 */
export abstract class IdentityCachingStrategy<Type> implements CachingStrategy<Type, Type, Type> {

  abstract getKey(item: Type): string;


  hasKey(cache: Map<string, Type>, key: string): boolean {
    return cache.has(key);
  }

  put(cache: Map<string, Type>, item: Type): Type {
    const key = this.getKey(item);
    cache.set(key, item);

    return item;
  }

  get(cache: Map<string, Type>, key: string): Type {
    return cache.get(key);
  }


  remove(cache: Map<string, Type>, item: Type): boolean {
    return cache.delete(this.getKey(item));
  }
}
