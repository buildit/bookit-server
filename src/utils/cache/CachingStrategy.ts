
export interface CachingStrategy<Type, Store, Return> {
  hasKey(cache: Map<string, Store>, key: string): boolean;
  put(cache: Map<string, Store>, item: Type): Return;
  get(cache: Map<string, Store>, key: string): Return;
  remove(cache: Map<string, Store>, item: Type): boolean;
}
