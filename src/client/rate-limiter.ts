/**
 * proactive token-bucket rate limiter for APIs that provide no `RateLimit-*` headers
 *
 * features strict FIFO queuing to prevent starvation and automatic rate recovery
 * to restore bandwidth after 429 throttling events.
 */
export interface RateLimiterOptions {
  /**
   * sustained request rate, in reqs/sec
   * default: 60 (or per-network default such as 350 for PikaNetwork)
   */
  ratePerSecond?: number;

  /**
   * maximum burst capacity
   */
  burst?: number;

  /**
   * ms of elapsed time after a 429 without further throttles
   * before gradually ramping rate back to original capacity.
   * default: 5000ms
   */
  recoveryCooldownMs?: number;
}

export class TokenBucketRateLimiter {
  private readonly capacity: number;
  private readonly initialRatePerMs: number;
  private readonly recoveryCooldownMs: number;

  private tokens: number;
  private ratePerMs: number;
  private lastRefillMs: number;
  private lastRateLimitMs: number;
  private queue: (() => void)[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: RateLimiterOptions = {}) {
    const ratePerSecond = Math.max(0.1, options.ratePerSecond ?? 60);
    this.capacity = Math.max(1, options.burst ?? 10);
    this.tokens = this.capacity;
    this.initialRatePerMs = ratePerSecond / 1000;
    this.ratePerMs = this.initialRatePerMs;
    this.recoveryCooldownMs = options.recoveryCooldownMs ?? 5000;
    this.lastRefillMs = Date.now();
    this.lastRateLimitMs = 0;
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillMs;
    if (elapsed <= 0) return;

    // Automatic rate recovery if throttled previously and cooldown has passed
    if (this.ratePerMs < this.initialRatePerMs && now - this.lastRateLimitMs > this.recoveryCooldownMs) {
      const recoveredRate = this.ratePerMs * 1.5;
      this.ratePerMs = Math.min(this.initialRatePerMs, recoveredRate);
    }

    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.ratePerMs);
    this.lastRefillMs = now;
  }

  private processQueue(): void {
    this.refillTokens();

    while (this.tokens >= 1 && this.queue.length > 0) {
      this.tokens -= 1;
      const resolve = this.queue.shift();
      resolve?.();
    }

    if (this.queue.length > 0 && !this.timer) {
      const deficit = 1 - this.tokens;
      const waitMs = Math.max(1, Math.ceil(deficit / this.ratePerMs));
      this.timer = setTimeout(() => {
        this.timer = null;
        this.processQueue();
      }, waitMs);
    }
  }

  /**
   * resolves once a token is available in FIFO order, consuming it
   */
  acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1 && this.queue.length === 0) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  /**
   * halves the rate and drains the bucket on 429 responses.
   * automatically ramps back up after `recoveryCooldownMs` without subsequent 429s.
   */
  onRateLimited(): void {
    this.ratePerMs = Math.max(this.ratePerMs * 0.5, 0.05 / 1000);
    this.tokens = 0;
    this.lastRefillMs = Date.now();
    this.lastRateLimitMs = Date.now();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.processQueue();
  }

  /**
   * returns current effective rate in requests per second
   */
  get currentRatePerSecond(): number {
    return this.ratePerMs * 1000;
  }
}
