import { defu } from 'defu';
import PQueue from 'p-queue';
import { runBatch } from '@/client/batch';
import { KeyvCache, NullCache } from '@/client/cache';
import { HttpClient } from '@/client/http';
import { defaultNetworkClientOptions } from '@/client/network-client-options';
import { TokenBucketRateLimiter } from '@/client/rate-limiter';
import { NetworkValidationError } from '@/errors';
import type { NetworkCache } from '@/client/cache';
import type { NetworkClientOptions } from '@/client/network-client-options';
import type { BatchOptions, BatchResult, RequestConfig } from '@/types';
import type { z } from 'zod';

/**
 * shared foundation for per-network clients
 *
 * owns http transport, caching, rate limiting, and batching.
 * subclasses supply `networkName`/`baseUrl`
 * and their own endpoint methods on top of `fetchAndValidate`.
 */
export abstract class NetworkClient {
  private readonly http: HttpClient;
  private readonly cache: NetworkCache;
  private readonly config: Required<
    Pick<NetworkClientOptions, keyof typeof defaultNetworkClientOptions>
  >;
  private readonly batchQueue: PQueue;

  protected abstract readonly networkName: string;
  protected abstract readonly baseUrl: string;

  constructor(options: NetworkClientOptions = {}) {
    this.config = defu(options, defaultNetworkClientOptions);
    const rateLimiter = new TokenBucketRateLimiter(options.rateLimit);
    this.http = new HttpClient({
      network: this.constructor.name,
      rateLimiter,
      defaultTimeoutMs: this.config.timeoutMs,
      defaultMaxRetries: this.config.maxRetries,
      userAgent: this.config.userAgent,
    });
    this.cache =
      options.cache === false ? new NullCache() : (options.cache ?? new KeyvCache());
    this.batchQueue = new PQueue({ concurrency: this.config.batchConcurrency });
  }

  /**
   * Fetches a response, validates it against `schema`, and caches the result under `cacheKey`.
   *
   * @returns the parsed response, or `null` for a missing entity (skips validation)
   * @throws {NetworkValidationError} if the response doesn't match `schema`
   */
  protected async fetchAndValidate<S extends z.ZodType>(
    cacheKey: string,
    url: string,
    schema: S,
    config: RequestConfig = {},
  ): Promise<z.infer<S> | null> {
    if (!config.skipCache) {
      const cached = await this.cache.get<z.infer<S>>(cacheKey);
      if (cached !== undefined) return cached;
    }

    const raw = await this.http.getJson(url, {
      timeoutMs: config.timeoutMs ?? this.config.timeoutMs,
      maxRetries: config.maxRetries ?? this.config.maxRetries,
      signal: config.signal,
    });

    if (raw === null) return null;

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new NetworkValidationError(
        this.networkName,
        `Response from ${url} didn't match the expected shape`,
        { url, issues: parsed.error.issues },
      );
    }

    const data = parsed.data as z.infer<S>;
    await this.cache.set(
      cacheKey,
      data,
      config.cacheTtlMs ?? this.config.defaultCacheTtlMs,
    );
    return data;
  }

  protected async invalidate(cacheKey: string): Promise<void> {
    await this.cache.delete(cacheKey);
  }

  /**
   * executes operations with bounded concurrency
   *
   * default: 10; override via `batchConcurrency` or per-call `concurrency`.
   *
   * every operation still goes through the same rate limiter as a single call.
   * refer to the batch requests guide for the full contract.
   */
  async batch<const T extends readonly (() => Promise<unknown>)[]>(
    operations: T,
    options?: BatchOptions,
  ): Promise<{ [K in keyof T]: BatchResult<Awaited<ReturnType<T[K]>>> }> {
    return runBatch(operations, this.batchQueue, options);
  }
}
