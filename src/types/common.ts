export interface RequestConfig {
  /**
   * abort the request if it takes longer than this
   * default: 10000ms
   */
  timeoutMs?: number;

  /**
   * max retry attempts on 429/5xx
   * default: 2
   */
  maxRetries?: number;

  /**
   * bypass the cache for this call even if caching is enabled
   */
  skipCache?: boolean;

  /**
   * override the cache TTL for this call
   */
  cacheTtlMs?: number;

  /**
   * abort signal to cancel the request
   */
  signal?: AbortSignal;

  /**
   * additional custom headers for this request
   */
  headers?: Record<string, string>;
}

export type BatchResult<T> =
  { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown };

export interface BatchOptions {
  concurrency?: number;
  throwOnError?: boolean;
  onProgress?: (completed: number, total: number) => void;
}
