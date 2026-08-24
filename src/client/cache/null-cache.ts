import type { NetworkCache } from '@/client/cache/network-cache';

/**
 * no-op cache for callers who want caching disabled entirely
 */
export class NullCache implements NetworkCache {
  get(): Promise<undefined> {
    return Promise.resolve(undefined);
  }
  set(): Promise<void> {
    return Promise.resolve();
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
  clear(): Promise<void> {
    return Promise.resolve();
  }
}
