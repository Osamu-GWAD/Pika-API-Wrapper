---
title: Gamemode Catalog
order: 9
---

# Gamemode Catalog

Generated at doc-build time from `src/networks/pika-network/enums.ts`, the same source the client validates every request against.

<Badge type="tip" text="inclusion rule" /> a stat is listed under a gamemode only if a real request for that exact combination returned `200`.

## Field reference

| Column              | Maps to                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| Raw key             | `stat` query parameter on [Leaderboards](./leaderboards)                             |
| Display name        | response key on [Profile Stats](./profile-stats), `name` field on [Totals](./totals) |
| Display name `null` | leaderboard-only, no per-player entry on Profile Stats                               |

## Full catalog

Filter by gamemode name or stat, raw key and display name both match. Gamemodes tagged `yearly` support `interval=yearly`; every other gamemode accepts the parameter without a `400` and silently returns an empty result instead.

<CatalogSearch />
