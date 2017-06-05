
import {CachingStrategy} from './CachingStrategy';

export abstract class ListCachingStrategy<Type> implements CachingStrategy<Type, Type[], Type[]> {


  abstract getKey(item: Type): string;


  abstract getIdentityMapper(item: Type): string;


  put(cache: Map<string, Type[]>, toCache: Type): Type[] {
    const key = this.getKey(toCache);
    return this.putKey(cache, key, toCache);
  }

  get(cache: Map<string, Type[]>, key: string): Type[] {
    return cache.get(key);
  }


  remove(cache: Map<string, Type[]>, item: Type): boolean {
    const key = this.getKey(item);
    return this.removeKey(cache, key, item);
  }


  putKey(cache: Map<string, Type[]>, key: string, toCache: Type): Type[] {
    const existing = cache.get(key);
    if (!existing) {
      const list = [toCache];
      cache.set(key, list);
      return list;
    }

    if (existing.length) {
      const found = existing.some(item => { return this.areIdentical(item, toCache); });
      if (found) {
        return;
      }
    }

    existing.push(toCache);

    return existing;
  }


  removeKey(cache: Map<string, Type[]>, key: string, item: Type): boolean {
    const existing = cache.get(key);
    if (!existing) {
      return false;
    }

    const filtered = existing.filter(meeting => { return this.areIdentical(meeting, item); });
    if (filtered.length) {
      cache.set(key, filtered);
      return true;
    }

    cache.delete(key);
    return true;
  }



  areIdentical(some: Type, other: Type) {
    return this.getIdentityMapper(some) === this.getIdentityMapper(other);
  }
}
