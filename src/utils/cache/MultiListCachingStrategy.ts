
import {ListCachingStrategy} from './ListCachingStrategy';

/**
 * An abstract implementation of a strategy that caches a particular object via multiple keys.  Since by definition,
 * we have multiple keys, that item will appear in multiple lists.
 *
 * The use case here is when caching meetings according to the participant.  A participant can be the owner, a room,
 * or another user.
 */
export abstract class MultiListCachingStrategy<Type> extends ListCachingStrategy<Type> {


  put(cache: Map<string, Type[]>, item: Type): Type[] {
    const cacheKeys = (keys: string[], cache: Map<string, Type[]>, item: Type) => {
      keys.forEach(key => super.putKey(cache, key, item));
    };

    const toParticipantsList = (keys: string[], cache: Map<string, Type[]>) => {
      const participantMap = keys.reduce((accumulator, key) => {
        const existing = cache.get(key);
        if (!existing) {
          return accumulator;
        }

        existing.forEach(item => {
          accumulator.set(this.getIdentityMapper(item), item);
        });

        return accumulator;
      }, new Map<string, Type>());

      return Array.from(participantMap.values());
    };

    /* */
    const keys = this.getKeys(item);
    cacheKeys(keys, cache, item);
    return toParticipantsList(keys, cache);
  }


  get(cache: Map<string, Type[]>, key: string): Type[] {
    return cache.get(key) || [];
  }


  remove(cache: Map<string, Type[]>, toRemove: Type): boolean {
    this.getKeys(toRemove)
        .forEach(key => super.removeKey(cache, key, toRemove));

    return true;
  }


  getKey(item: Type): string {
    throw new Error('getKey() is not supported for multi list caching');
  }

  abstract getKeys(item: Type): string[];


  abstract getIdentityMapper(item: Type): string;
}
