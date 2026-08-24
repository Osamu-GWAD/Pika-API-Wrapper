/**
 * caches network responses to avoid redundant requests.
 * uses keyv's in-memory adapter by default.
 * pass a persistent adapter for shared or durable caching.
 */
export interface NetworkCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
