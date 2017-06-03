
export interface CachingListStrategy<T> {
  put(cache: Map<string, T>, item: T): void;

  get(cache: Map<string, T>, key: string): T;
}
