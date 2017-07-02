
import {CachingStrategy} from './CachingStrategy';

export abstract class IdentityCachingStrategy<Type> implements CachingStrategy<Type, Type, Type> {

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


  abstract getKey(item: Type): string;
}
