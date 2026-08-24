/**
 * proactive token-bucket rate limiter for APIs that provide no `RateLimit-*` headers
 *
 * networks set their own defaults;
 * see each client's constructor for the values and where they came from.
 */
export interface RateLimiterOptions {
  /**
   * sustained request rate, in reqs/sec
   */
  ratePerSecond?: number;

  /**
   * maximum burst capacity
   */
  burst?: number;
}

export class TokenBucketRateLimiter {
  private readonly capacity: number;
  private tokens: number;
  private ratePerMs: number;
  private lastRefillMs: number;

  constructor(options: RateLimiterOptions = {}) {
    const ratePerSecond = options.ratePerSecond ?? 1;
    this.capacity = options.burst ?? 3;
    this.tokens = this.capacity;
    this.ratePerMs = ratePerSecond / 1000;
    this.lastRefillMs = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillMs;
    if (elapsed <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.ratePerMs);
    this.lastRefillMs = now;
  }

  /**
  resolves once a token is available, consuming it
  */
  async acquire(): Promise<void> {
    for (;;) {
      this.refillTokens();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const deficit = 1 - this.tokens;
      const waitMs = Math.max(1, Math.ceil(deficit / this.ratePerMs));
      await sleep(waitMs);
    }
  }

  /**
   * halves the rate and drains the bucket
   *
   * called on 429 so the subsequent requests therefore back off
   * instead of trying at the same pace.
   */
  onRateLimited(): void {
    this.ratePerMs = Math.max(this.ratePerMs * 0.5, 0.05 / 1000);
    this.tokens = 0;
    this.lastRefillMs = Date.now();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
