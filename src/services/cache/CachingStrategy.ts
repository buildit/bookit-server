export interface CachingStrategy<T> {
  put(cache: Map<string, any>, item: T): void;

  get(cache: Map<string, any>, item: T): void;

  computeKey(item: T): string;
}
