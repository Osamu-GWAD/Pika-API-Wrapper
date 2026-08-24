---
title: Batch Requests
order: 4
---

<script setup>
import { data } from '../.vitepress/data/pika-network.data';
</script>

# Batch Requests

Every network client exposes a generic `batch()` method, and most mixins layer a purpose-built batched variant on top of it (`getProfiles`, `getClans`, `getLeaderboards`, `getProfileStatsBatch`).

## Basic usage

```ts
const profiles = await pika.getProfiles(['divena', 'Notch', 'jeb_']);

for (const result of profiles) {
  if (result.status === 'fulfilled') {
    console.log(result.value);
  } else {
    console.error(result.reason);
  }
}
```

## The contract

- **Order is preserved.** `profiles[i]` corresponds to `usernames[i]`, regardless of which operation finishes first.
- **Failures are isolated.** One failing request doesn't cancel the others. Each settles independently into `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`, unless you pass `throwOnError: true`.
- **Concurrency is bounded.** Defaults to **{{ data.defaultBatchConcurrency }}** simultaneous in-flight operations (`batchConcurrency` on the client, overridable per call via `options.concurrency`).
- **Still rate-limited.** Every operation in a batch goes through the exact same rate limiter as a single call. Batching doesn't bypass it; it parallelizes within the limiter's constraints.

## Options

```ts
await pika.getProfiles(usernames, undefined, {
  concurrency: 5,
  throwOnError: true,
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
});
```

## Calling `batch()` directly

For anything not covered by a purpose-built batched method:

```ts
const results = await pika.batch([
  () => pika.getProfile('divena'),
  () => pika.getClan('SomeClan'),
  () => pika.getLeaderboard({ gamemode: 'bedwars', stat: 'wins' }),
]);
```

Each operation's return type is inferred individually, so a mixed-type batch like the one above stays fully typed instead of widening to a shared union.

`runBatch` (`src/client/batch.ts`) is the shared implementation underneath every `batch()` call. It isn't part of the public API surface, but it's worth a read if you want to see exactly how concurrency and failure isolation are implemented.
