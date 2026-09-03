import pRetry, { AbortError } from 'p-retry';
import { logger } from '@/client/logger';
import { defaultRetryBackoff } from '@/client/retry-backoff';
import type { TokenBucketRateLimiter } from '@/client/rate-limiter';

/**
 * internal signal used to distinguish retryable status codes (429/5xx) from unhandled errors.
 * consumed by `withRetry`, and is not propagated to the caller.
 */
export class RetrySignal extends Error {
  constructor(readonly isRateLimit: boolean) {
    super('retryable');
  }
}

/**
 * checks whether an error is a transient network/transport error that should be retried.
 */
export function isRetryableNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as Error & { code?: string; cause?: unknown };

  if (err.name === 'AbortError') return false;

  const code = err.code ?? '';
  const message = err.message ?? '';

  const retryableCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_SOCKET',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
  ];

  if (retryableCodes.includes(code)) return true;

  if (
    /timeout|fetch failed|network|socket hang up|connection reset|econnreset|etimedout/i.test(
      message,
    )
  ) {
    return true;
  }

  if (err.cause && isRetryableNetworkError(err.cause)) {
    return true;
  }

  return false;
}

/**
 * executes `attempt`, retrying retryable failures (429/5xx and transient network dropouts)
 * with jittered exponential backoff and AbortSignal support.
 */
export async function withRetry<T>(
  attempt: () => Promise<T>,
  rateLimiter: TokenBucketRateLimiter,
  maxRetries: number,
  signal?: AbortSignal,
): Promise<T> {
  return pRetry(
    async () => {
      if (signal?.aborted) {
        throw new AbortError(new DOMException('This operation was aborted', 'AbortError'));
      }
      try {
        return await attempt();
      } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
          throw new AbortError(error as Error);
        }
        if (error instanceof RetrySignal) {
          if (error.isRateLimit) rateLimiter.onRateLimited();
          throw error;
        }
        if (isRetryableNetworkError(error)) {
          throw error;
        }
        throw new AbortError(error as Error);
      }
    },
    {
      retries: maxRetries,
      signal,
      factor: defaultRetryBackoff.factor,
      minTimeout: defaultRetryBackoff.minTimeoutMs,
      maxTimeout: defaultRetryBackoff.maxTimeoutMs,
      randomize: defaultRetryBackoff.randomize,
      onFailedAttempt: ({ attemptNumber, retriesLeft, error }) => {
        logger.warn(
          `Attempt ${String(attemptNumber)} failed (${(error)?.message || error}), ${String(retriesLeft)} retries left`,
        );
      },
    },
  );
}
