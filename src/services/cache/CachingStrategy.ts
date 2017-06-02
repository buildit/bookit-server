
export interface CachingStrategy<Type, Store, Return> {
  put(cache: Map<string, Store>, item: Type): Return;
  get(cache: Map<string, Store>, key: string): Return;
}
