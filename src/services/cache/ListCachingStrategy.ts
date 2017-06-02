
import {CachingStrategy} from './CachingStrategy';

export abstract class ListCachingStrategy<Type> implements CachingStrategy<Type, Type[], Type[]> {

  put(cache: Map<string, Type[]>, item: Type): Type[] {
    const key = this.getKey(item);

    const existing = cache.get(key);
    if (!existing) {
      const list = [item];
      cache.set(key, list);
      return list;
    }

    if (existing.length) {
      const found = existing.some(meeting => {
        return this.getIdentityMapper(meeting) === this.getIdentityMapper(item);
      });

      if (found) {
        return;
      }
    }

    existing.push(item);

    return existing;
  }

  get(cache: Map<string, Type[]>, key: string): Type[] {
    return cache.get(key);
  }

  abstract getKey(item: Type): string;


  abstract getIdentityMapper(item: Type): string;
}
