---
title: Rate Limiting
order: 5
---

<script setup>
import { data } from '../.vitepress/data/pika-network.data';
</script>

# Rate Limiting

Read this before changing the defaults.

`PikaNetworkClient` defaults to a token-bucket limiter of **{{ data.defaultRateLimit.ratePerSecond }} requests/second**, burst **{{ data.defaultRateLimit.burst }}** (`PikaNetworkDefaultRateLimit`, applied via the `rateLimit` option). This is derived from load-testing against the live API; there's no official PikaNetwork spec for it.

## Why proactive, not reactive

PikaNetwork's API returns no `RateLimit-*` response headers, so there's nothing to read and react to after the fact. Instead, every request acquires a token from a [`TokenBucketRateLimiter`](/api/classes/TokenBucketRateLimiter) before it's sent. Requests simply wait for a token to become available rather than firing and finding out afterward that they were too fast.

## The 429 backoff is still there underneath

Even with the proactive limiter, a `429` can still happen (clock drift, another process sharing the same IP, PikaNetwork tightening limits without notice). When it does:

1. The rate limiter's `onRateLimited()` halves its rate and drains the bucket, so subsequent requests, including unrelated ones sharing the same client instance, immediately slow down.
2. The request itself retries with jittered exponential backoff: factor **{{ data.retryBackoff.factor }}**, between **{{ data.retryBackoff.minTimeoutMs }}ms** and **{{ data.retryBackoff.maxTimeoutMs }}ms**, up to `maxRetries` attempts (default **{{ data.defaultMaxRetries }}**).
3. If retries are exhausted, it throws [`NetworkRateLimitError`](/api/classes/NetworkRateLimitError).

## Overriding the defaults

```ts
const pika = new PikaNetworkClient({
  rateLimit: { ratePerSecond: 200, burst: 10 },
});
```

Only turn this up if your own testing against the live API says the defaults are unnecessarily conservative for your use case. Turning it up carelessly risks tripping PikaNetwork's actual, undocumented limit, which is exactly what the proactive limiter exists to avoid.

## Other relevant defaults

| Setting           | Default                            | Option              |
| ----------------- | ---------------------------------- | ------------------- |
| Request timeout   | {{ data.defaultTimeoutMs }}ms      | `timeoutMs`         |
| Max retries       | {{ data.defaultMaxRetries }}       | `maxRetries`        |
| Cache TTL         | {{ data.defaultCacheTtlMs }}ms     | `defaultCacheTtlMs` |
| Batch concurrency | {{ data.defaultBatchConcurrency }} | `batchConcurrency`  |

All four are set in `src/client/network-client-options.ts` and documented in [`NetworkClientOptions`](/api/interfaces/NetworkClientOptions).
