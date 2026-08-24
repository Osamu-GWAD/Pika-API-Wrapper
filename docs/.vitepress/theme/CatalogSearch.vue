<script setup lang="ts">
import { computed, ref } from 'vue';
import { data } from '../data/pika-network-catalog.data';

const query = ref('');

const filteredGamemodes = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return data.gamemodes;

  return data.gamemodes
    .map((gamemode) => {
      if (gamemode.gamemode.toLowerCase().includes(term)) return gamemode;

      const stats = gamemode.stats.filter(
        (stat) =>
          stat.rawKey.toLowerCase().includes(term) ||
          stat.displayName?.toLowerCase().includes(term),
      );
      return stats.length ? { ...gamemode, stats } : null;
    })
    .filter((gamemode): gamemode is (typeof data.gamemodes)[number] => gamemode !== null);
});
</script>

<template>
  <div class="craftify-catalog">
    <input
      v-model="query"
      type="search"
      class="craftify-catalog-search"
      placeholder="filter by gamemode or stat, e.g. bedwars, BOW_KILLS, Balance"
    />

    <p
      v-if="!filteredGamemodes.length"
      class="craftify-catalog-empty"
    >
      no gamemode or stat matches <code>{{ query }}</code>
    </p>

    <details
      v-for="gamemode in filteredGamemodes"
      :key="gamemode.gamemode"
      class="craftify-catalog-entry"
      :open="query.length > 0"
    >
      <summary>
        <code>{{ gamemode.gamemode }}</code>
        <span class="craftify-catalog-count">{{ gamemode.stats.length }} stats</span>
        <span
          v-if="gamemode.yearlyCapable"
          class="craftify-catalog-yearly"
          >yearly</span
        >
      </summary>

      <p>
        <strong>Modes:</strong>
        <code
          v-for="mode in gamemode.modes"
          :key="mode"
          >{{ mode }}
        </code>
      </p>
      <p v-if="gamemode.requiredMode">
        <strong>Required mode:</strong> <code>{{ gamemode.requiredMode }}</code>
      </p>
      <p v-if="gamemode.aliases.length">
        <strong>Aliases:</strong>
        <span
          v-for="entry in gamemode.aliases"
          :key="entry.alias"
        >
          <code>{{ entry.alias }}</code> resolves to the same data as
          <code>{{ entry.canonical }}</code
          >.
        </span>
      </p>

      <table>
        <thead>
          <tr>
            <th>Raw key</th>
            <th>Display name</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stat in gamemode.stats"
            :key="stat.rawKey"
          >
            <td>
              <code>{{ stat.rawKey }}</code>
            </td>
            <td>
              <code v-if="stat.displayName">{{ stat.displayName }}</code>
              <em v-else>leaderboard only</em>
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.craftify-catalog-search {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--vp-c-divider);
  border-radius: 2px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: border-color 0.2s ease;
}

.craftify-catalog-search:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.craftify-catalog-empty {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.craftify-catalog-yearly {
  font-weight: 400;
  font-size: 0.75rem;
  padding: 1px 8px;
  border-radius: 2px;
  background: var(--vp-badge-tip-bg);
  color: var(--vp-badge-tip-text);
  border: 1px solid var(--vp-badge-tip-border);
}
</style>
