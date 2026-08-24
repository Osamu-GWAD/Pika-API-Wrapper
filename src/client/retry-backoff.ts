/**
 * backoff tuning shared by every retry attempt
 *
 * split out from http/retry.ts so it can be consumed (by docs, tests, etc)
 * without importing p-retry or the logger.
 *
 * this file has zero imports on purpose.
 */
export const defaultRetryBackoff = {
  factor: 2,
  minTimeoutMs: 1000,
  maxTimeoutMs: 8000,
  randomize: true,
} as const;
