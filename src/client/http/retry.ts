import pRetry, { AbortError } from 'p-retry';
import { logger } from '@/client/logger';
import { defaultRetryBackoff } from '@/client/retry-backoff';
import type { TokenBucketRateLimiter } from '@/client/rate-limiter';

/**
 * internal signal used to distinguish retryable failures from unhandled (?) errors.
 * consumed by `withRetry`, and is not propagated to the caller.
 */
export class RetrySignal extends Error {
  constructor(readonly isRateLimit: boolean) {
    super('retryable');
  }
}

/**
 * executes `attempt`, retrying retryable failures with jittered exponential backoff.
 *
 * rate-limit signals also notify the shared rate limiter, allowing subsequent
 * requests to back off immediately rather than waiting for this retry cycle.
 */
export async function withRetry<T>(
  attempt: () => Promise<T>,
  rateLimiter: TokenBucketRateLimiter,
  maxRetries: number,
): Promise<T> {
  return pRetry(
    async () => {
      try {
        return await attempt();
      } catch (error) {
        if (error instanceof RetrySignal) {
          if (error.isRateLimit) rateLimiter.onRateLimited();
          throw error; // retryable failure; let p-retry apply the configured backoff.
        }
        throw new AbortError(error as Error); // non-retryable failure; terminate.
      }
    },
    {
      retries: maxRetries,
      factor: defaultRetryBackoff.factor,
      minTimeout: defaultRetryBackoff.minTimeoutMs,
      maxTimeout: defaultRetryBackoff.maxTimeoutMs,
      randomize: defaultRetryBackoff.randomize,
      onFailedAttempt: ({ attemptNumber, retriesLeft }) => {
        logger.warn(
          `Attempt ${String(attemptNumber)} failed, ${String(retriesLeft)} retries left`,
        );
      },
    },
  );
}
