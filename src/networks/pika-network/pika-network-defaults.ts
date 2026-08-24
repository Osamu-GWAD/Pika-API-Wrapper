/**
 * shared PikaNetwork client defaults
 *
 * kept independent of the client implementation
 * so they can be consumed by docs, tests, etc
 * without importing the client itself.
 *
 * this file has zero imports on purpose.
 */
export const PikaNetworkDefaultBaseUrl = 'https://stats.pika-network.net/api';

/**
 * REVIEW: derived from live API load testing (approximated).
 * override via `rateLimit` when using different request constraints.
 */
export const PikaNetworkDefaultRateLimit = { ratePerSecond: 350, burst: 16 } as const;
