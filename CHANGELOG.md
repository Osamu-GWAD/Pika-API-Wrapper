# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.0.0

Initial release.

- Typed, runtime-validated (zod) client for PikaNetwork's stats API, with `NetworkClient` as a network-agnostic base for future networks (JartexNetwork planned).
- Generated, crawl-verified `Gamemode`/`Mode`/`Stat`/`Interval` enums, plus friendly aliases, with invalid combinations rejected client-side before a request is sent.
- Endpoint coverage: leaderboards, totals, profile, profile stats, clans, match recaps, ping.
- Proactive token-bucket rate limiting with 429-aware backoff, `p-retry`-driven retries, and a pluggable Keyv-backed cache.
- First-class batch requests with bounded concurrency, order preservation, and per-item failure isolation.
- Dual ESM/CJS build via `unbuild`, verified with `publint` and `@arethetypeswrong/cli`.
