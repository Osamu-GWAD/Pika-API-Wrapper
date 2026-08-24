import type { NetworkCache } from '@/client/cache';
import type { RateLimiterOptions } from '@/client/rate-limiter';

export interface NetworkClientOptions {
  /**
   * overrides the default rate limiter configuration.
   * see `rate-limiter.ts` for the rationale behind why defaults are conservative.
   */
  rateLimit?: RateLimiterOptions;

  /**
   * custom cache backend
   *
   * defaults to keyv's in-memory adapter.
   * pass `false` to disable caching.
   */
  cache?: NetworkCache | false;

  /**
   * default ttl for cached reads
   */
  defaultCacheTtlMs?: number;

  timeoutMs?: number;

  maxRetries?: number;

  userAgent?: string;

  /**
   * default max simultaneous in-flight operations for `batch()` calls;
   * individual calls are unaffected.
   */
  batchConcurrency?: number;
}

export const defaultNetworkClientOptions = {
  defaultCacheTtlMs: 60_000,
  timeoutMs: 10_000,
  maxRetries: 2,
  userAgent: 'craftify',
  batchConcurrency: 10,
} as const satisfies Partial<NetworkClientOptions>;
