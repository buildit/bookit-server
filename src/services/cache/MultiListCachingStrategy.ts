
import {CachingStrategy} from './CachingStrategy';

export abstract class MultiListCachingStrategy<Type> implements CachingStrategy<Type, Type[], Type[]> {


  put(cache: Map<string, Type[]>, item: Type): Type[] {
    const cacheKeys = (keys: string[], cache: Map<string, Type[]>, item: Type) => {
      keys.forEach(key => {
        const existing = cache.get(key);
        if (!existing) {
          const list = [item];
          cache.set(key, list);
          return;
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
      });
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


  abstract getKeys(item: Type): string[];


  abstract getIdentityMapper(item: Type): string;
}
