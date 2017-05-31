export interface CachingStrategy<T> {
  put(cache: Map<string, T>, item: T): void;

  get(cache: Map<string, T>, item: T): void;

  computeKey(item: T): string;
}
