/**
 * A parameterized interface that represents a caching strategy against a cache or store.
 *
 * The 'Type' parameter is the type of the objects that you want to cache.
 *
 * The 'Store' parameter is the type of the backing object of the cache, essentially the cache.  The key type
 * will always be a string to coincide with JS maps.
 *
 *  The 'Return' parameter is the type of the return value from various methods.  Sometimes the stores
 * cache to a list, sometimes to the item itself.  In the future, it may have some more complex nested map.
 *
 */
export interface CachingStrategy<Type, Store, Return> {

  hasKey(cache: Map<string, Store>, key: string): boolean;

  put(cache: Map<string, Store>, item: Type): Return;

  get(cache: Map<string, Store>, key: string): Return;

  remove(cache: Map<string, Store>, item: Type): boolean;
}


export interface SurrogateCachingStrategy<Surrogate, Type, Store, Return> {
  hasSurrogateKey(cache: Map<string, Store>, surrogate: Surrogate): boolean;
  put(cache: Map<string, Store>, surrogate: Surrogate, item: Type): Return;
  get(cache: Map<string, Store>, surrogate: Surrogate): Return;
  remove(cache: Map<string, Store>, surrogate: Surrogate, item: Type): boolean;
}
