
import {CachingStrategy} from './CachingStrategy';

export abstract class IdentityCachingStrategy<Type> implements CachingStrategy<Type, Type, Type> {
  put(cache: Map<string, Type>, item: Type): Type {
    const key = this.getKey(item);
    cache.set(key, item);

    return item;
  }

  get(cache: Map<string, Type>, key: string): Type {
    return cache.get(key);
  }

  abstract getKey(item: Type): string;
}
