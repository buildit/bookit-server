
export interface CachingStrategy<Type, Store> {
  put(cache: Map<string, Store>, item: Type): Store;
  get(cache: Map<string, Store>, key: string): Store;
}
