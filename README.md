# @kyizl/craftify

Typed, runtime-validated API client for CraftiGames stats networks. PikaNetwork is fully implemented today; JartexNetwork is planned on top of the same network-agnostic foundation.

## Why craftify

Most community API wrappers stop at typing the happy path and leave everything else, retries, rate limits, cache invalidation, response drift, as an exercise for the consumer. Craftify treats those as first-class concerns:

- **Validated at the boundary.** Every response is parsed against a zod schema before it reaches your code. A shape change upstream throws a clear `NetworkValidationError` instead of handing you `undefined` three calls later.
- **Generated enums, not guesses.** `Gamemode`, `Mode`, `Stat`, and `Interval` come from a real crawl of the live API. Invalid combinations are rejected client-side, before a request is ever sent.
- **Rate-limited and cached by default.** A proactive token-bucket limiter and a pluggable Keyv cache ship out of the box, so there's no hand-rolled backoff logic to write.
- **Batching with real guarantees.** Bounded concurrency, preserved input order, and per-item failure isolation for every list-based endpoint.

## Install

```bash
npm install @kyizl/craftify
```

## Quick start

```ts
import { Gamemode, PikaNetworkClient, Stat } from '@kyizl/craftify';

const pika = new PikaNetworkClient();

const leaderboard = await pika.getLeaderboard({
  gamemode: Gamemode.BedWars,
  stat: Stat.BedWars.Kills,
  limit: 10,
});

const stats = await pika.getProfileStats({
  username: 'divena',
  gamemode: Gamemode.BedWars,
});
const finalKills = stats.StatKey.BedWars.FinalKills;

const profile = await pika.getProfile('divena'); // null if the username doesn't exist

// many players at once, concurrency-bounded, still rate-limited underneath
const profiles = await pika.getProfiles(['divena', 'Notch', 'jeb_']);
```

Invalid combinations throw synchronously, before any request is sent:

```ts
await pika.getLeaderboard({
  gamemode: 'opprison',
  stat: 'PRISON_TOKEN_BALANCE',
  mode: 'SOLO',
});
// RangeError: "SOLO" is not a valid mode for gamemode "opprison". Valid modes: ALL_MODES
```

See the [Getting Started](docs/guide/getting-started.md), [Gamemodes and Enums](docs/guide/gamemodes-and-enums.md), [Ergonomic Constants](docs/guide/ergonomic-constants.md), [Batch Requests](docs/guide/batch-requests.md), and [Rate Limiting](docs/guide/rate-limiting.md) guides for the full picture, or browse the live documentation site linked from the [API Reference](docs/api/index.md).

## Endpoint coverage

| Method                                                        | Returns                              | Notes                                         |
| ------------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `getLeaderboard` / `getLeaderboards`                          | paginated leaderboard entries        | batched variant preserves request order       |
| `getTotals`                                                   | server-wide aggregate for a gamemode | sums and averages, not per-player             |
| `getProfile` / `getProfiles`                                  | a player's public profile            | `null` if the username doesn't exist          |
| `getProfileStats` / `getProfileStat` / `getProfileStatsBatch` | per-player stats for a gamemode/mode | `.StatKey` accessor for direct, typed lookups |
| `getClan` / `getClans`                                        | a clan's public profile              | `null` if the clan doesn't exist              |
| `getMatchRecap`                                               | a single match's recap               | `null` if the id doesn't exist, never cached  |
| `ping`                                                        | `boolean`                            | `true` only when the API replies `"Pong!"`    |

## Status code semantics

| Status           | Meaning                                         | Client behavior                                                         |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| 200              | success                                         | validated and returned                                                  |
| 204              | valid request, player has no data for this mode | `[]` / empty result, not an error                                       |
| 404 (empty body) | player/recap doesn't exist                      | `null`, not an error                                                    |
| 404 (JSON body)  | unmapped route                                  | throws `NetworkHTTPError`                                               |
| 400              | invalid gamemode/mode/stat/interval combo       | throws `NetworkBadRequestError`                                         |
| 429              | rate limited                                    | rate limiter backs off and retries, then throws `NetworkRateLimitError` |
| 5xx              | server/edge error                               | retried with backoff, then throws `NetworkHTTPError`                    |

The full error hierarchy (`NetworkAPIError` and its subclasses) is documented in the [API Reference](docs/api/classes/NetworkAPIError.md).

## Documentation

Full guides and the generated API reference live at the project's documentation site (build it locally with `npm run docs:dev`), covering:

- [Getting Started](docs/guide/getting-started.md), for the shortest path from install to a validated response.
- [Gamemodes and Enums](docs/guide/gamemodes-and-enums.md), for how the generated enums are crawled and kept accurate.
- [Ergonomic Constants](docs/guide/ergonomic-constants.md), for the `Gamemode` / `Mode` / `Stat` / `Interval` / `StatKey` aliases.
- [Batch Requests](docs/guide/batch-requests.md), for the concurrency, ordering, and failure-isolation contract.
- [Rate Limiting](docs/guide/rate-limiting.md), for why the defaults are conservative and how to override them responsibly.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, the verification workflow, and commit conventions.

## License

MIT
