---
title: Gamemodes and Enums
order: 2
---

<script setup>
import { data } from '../.vitepress/data/pika-network.data';
</script>

# Gamemodes and Enums

`src/networks/pika-network/enums.ts` is **generated, not hand-written**. Hand-typing PikaNetwork's gamemode, mode, and stat combinations would mean guessing, and guesses go stale the moment the API changes shape.

## How it's generated

The enums are built from a real crawl of the live API, treating an actual `200` response as ground truth: a `stat`/`mode` combination only makes it into the generated types if it was observed working for that specific gamemode. A `400` means the combination is invalid even if the stat name looks plausible. `BOW_KILLS` is bedwars-only, for example; every other gamemode returns `400` on it, and that's enforced by the generated types, not a comment.

A handful of documented-but-not-crawled stats (mostly OpSkyBlock's skill levels, along with a few koth and killstreak counters) are layered on separately. The generation tooling itself is internal and not part of this package.

## What's currently tracked

This table is pulled live from the generated `PikaNetworkStats` export, so regenerating the enums updates it automatically:

<table>
  <thead>
    <tr><th>Gamemode</th><th>Stats tracked</th></tr>
  </thead>
  <tbody>
    <tr v-for="gamemode in data.gamemodes" :key="gamemode">
      <td><code>{{ gamemode }}</code></td>
      <td>{{ data.statCountByGamemode[gamemode] }}</td>
    </tr>
  </tbody>
</table>

**{{ data.gamemodeCount }}** gamemodes, **{{ data.totalStatCount }}** stats total.

`interval=yearly` is only accepted for: <code v-for="gm in data.yearlyCapableGamemodes" :key="gm">{{ gm }} </code>. Every other gamemode silently returns empty results instead of a clean `400`, so this client rejects it before the request is even sent.

## Client-side validation

Every gamemode, mode, and interval combination is checked against the generated enums before a request goes out:

```ts
await pika.getLeaderboard({
  gamemode: 'opprison',
  stat: 'PRISON_TOKEN_BALANCE',
  mode: 'SOLO',
});
```

This is implemented in `src/networks/pika-network/guards.ts` (`assertValidCombination`), called from every mixin that takes a gamemode, mode, or interval.

## Full type and value reference

Every generated type (`PikaNetworkGamemode`, `PikaNetworkMode`, `PikaNetworkStat`, `PikaNetworkStatKey`, `PikaNetworkInterval`) and value (`PikaNetworkGamemodes`, `PikaNetworkModes`, `PikaNetworkStats`, `PikaNetworkIntervals`) is documented in the [API Reference](/api/).
