import { createFetch } from 'ofetch';
import { RetrySignal, withRetry } from '@/client/http/retry';
import { interpretStatus } from '@/client/http/status';
import {
  NetworkAPIError,
  NetworkBadRequestError,
  NetworkHTTPError,
  NetworkRateLimitError,
} from '@/errors';
import type { TokenBucketRateLimiter } from '@/client/rate-limiter';

// resolve `globalThis.fetch` at call time rather than module initialization.
// ofetch captures the global fetch implementation when the client is created,
// which prevents test environments from replacing `globalThis.fetch` afterward.
const fetch = createFetch({
  fetch: (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
});

export interface HttpClientOptions {
  network: string;
  rateLimiter: TokenBucketRateLimiter;
  defaultTimeoutMs?: number;
  defaultMaxRetries?: number;
  userAgent?: string;
}

export interface GetJsonOptions {
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly network: string;
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxRetries: number;
  private readonly userAgent: string;

  constructor(options: HttpClientOptions) {
    this.network = options.network;
    this.rateLimiter = options.rateLimiter;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
    this.defaultMaxRetries = options.defaultMaxRetries ?? 2;
    this.userAgent = options.userAgent ?? 'craftify';
  }

  /**
   * Gets a URL and returns the parsed body, or `null` for a clean not-found.
   * @throws a `NetworkAPIError` subclass for anything else
   */
  async getJson(url: string, options: GetJsonOptions = {}): Promise<unknown> {
    const maxRetries = options.maxRetries ?? this.defaultMaxRetries;

    try {
      return await withRetry(
        async () => {
          await this.rateLimiter.acquire();

          if (options.signal?.aborted) {
            throw new DOMException('This operation was aborted', 'AbortError');
          }

          let response;
          try {
            response = await fetch.raw(url, {
              timeout: options.timeoutMs ?? this.defaultTimeoutMs,
              signal: options.signal,
              ignoreResponseError: true,
              retry: false, // retry, backoff, and rate-limit handling are delegated to `withRetry`
              headers: {
                Accept: 'application/json',
                'User-Agent': this.userAgent,
                ...options.headers,
              },
            });
          } catch (error) {
            if (
              options.signal?.aborted ||
              (error instanceof Error && error.name === 'AbortError')
            ) {
              throw error;
            }
            throw new NetworkHTTPError(
              this.network,
              `Error fetching ${url}: ${(error as Error)?.message ?? error}`,
              { url, cause: error },
            );
          }

          const outcome = interpretStatus(response.status, response._data, url);

          switch (outcome.kind) {
            case 'success': {
              return outcome.body;
            }
            case 'empty': {
              return null;
            }
            case 'bad-request': {
              throw new NetworkBadRequestError(
                this.network,
                `Bad request (check gamemode/mode/stat/interval casing and combination): ${url}`,
                { url, cause: outcome.body },
              );
            }
            case 'http-error': {
              throw new NetworkHTTPError(this.network, outcome.message, {
                status: response.status,
                url,
              });
            }
            case 'retryable': {
              throw new RetrySignal(outcome.isRateLimit);
            }
          }
        },
        this.rateLimiter,
        maxRetries,
        options.signal,
      );
    } catch (error) {
      if (
        options.signal?.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw error;
      }
      if (error instanceof NetworkAPIError) throw error;
      if (error instanceof RetrySignal) {
        throw error.isRateLimit
          ? new NetworkRateLimitError(this.network, 'rate-limit-exceeded', { url })
          : new NetworkHTTPError(this.network, `Error from ${url} after retries`, {
              url,
            });
      }
      throw error;
    }
  }
}
