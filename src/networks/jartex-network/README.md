# Adding JartexNetwork

Not implemented yet. `src/client/*` (the `NetworkClient` base) is already
network-agnostic, so this should mostly be new files, not changes to
existing ones. Steps, mirroring how `pika-network/` is structured:

1. **Crawl it.** Reuse the same crawl-index shape used for
   `data/pika-crawl.json` (an array of `{ gamemode, mode?, stat?, kind,
status, personalKey?, body, url }` probe records) so
   `scripts/generate-pika-network-enums.mjs` can be copied to
   `scripts/generate-jartex-network-enums.mjs` with minimal changes —
   mostly just the `DOCS_SUPPLEMENT` block, since that part is
   JartexNetwork-specific knowledge (whatever their equivalent of the
   "yearly only works on two gamemodes" quirk turns out to be).

2. **`jartex-network/enums.ts`** — generated the same way, giving you
   `JartexNetworkGamemode`, `JartexNetworkMode<G>`, `JartexNetworkStat<G>`,
   etc.

3. **`jartex-network/schemas.ts`** — zod schemas for Jartex's response
   shapes. Don't assume they match Pika's `{ metadata: { total }, entries:
[...] }` shape — verify against real responses first. If Jartex
   requires an API key (unlike Pika), that's the one place `NetworkClient`
   will need a small addition: an optional `apiKey`/multi-key-rotation
   option on `NetworkClientOptions`, threaded through to `HttpClient` as a
   header. Nothing else in the client layer assumes "no auth" — it was
   kept deliberately unaware of Pika's specific lack of auth.

4. **`jartex-network/jartex-network-client.ts`** — `class
JartexNetworkClient extends NetworkClient`, same pattern as
   `PikaNetworkClient`: `networkName`, `baseUrl`, endpoint methods calling
   `this.fetchAndValidate(...)`.

5. **Rate limits**: don't assume Jartex's limits match Pika's documented
   ~60-120 req/min. Verify Jartex's actual documented/observed limit the
   same careful way before picking `TokenBucketRateLimiter` defaults for
   it — see the warning in `src/client/rate-limiter.ts`.

6. Export it from `src/index.ts` next to the Pika export, and re-export
   from a new `jartex-network/index.ts` barrel.

If the overlay app wants a single unified interface across both networks
(e.g. "get BedWars kills" regardless of which server), that's a thin
adapter layer on top of `PikaNetworkClient`/`JartexNetworkClient` in the
app itself — deliberately not baked into this package, since the two
networks' stat catalogs won't line up 1:1 (see how sprawling PikaNetwork's
own 14 gamemodes already are) and forcing a shared shape would just lose
data.
