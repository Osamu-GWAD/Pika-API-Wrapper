<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { data } from '../data/pika-network.data';

const stats = [
  { label: 'gamemodes', value: data.gamemodeCount },
  { label: 'parameters', value: data.totalStatCount },
];

const displayed = ref(stats.map(() => 0));

onMounted(() => {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    displayed.value = stats.map((stat) => stat.value);
    return;
  }

  const durationMs = 900;
  const startTime = performance.now();

  function tick(now: number) {
    const progress = Math.min(1, (now - startTime) / durationMs);
    const eased = 1 - (1 - progress) ** 3;
    displayed.value = stats.map((stat) => Math.round(stat.value * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
});
</script>

<template>
  <div class="craftify-stats">
    <div
      class="craftify-stat"
      v-for="(stat, index) in stats"
      :key="stat.label"
    >
      <span class="craftify-stat-value">{{ displayed[index] }}</span>
      <span class="craftify-stat-label">{{ stat.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.craftify-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 12px;
  margin: 18px auto 28px;
  max-width: 560px;
}

.craftify-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 64px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 92%, transparent);
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.craftify-stat:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 79, 100, 0.5);
}

.craftify-stat-value {
  font-size: clamp(1.5rem, 2vw, 2.1rem);
  line-height: 1;
  letter-spacing: -0.06em;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--craftify-accent);
}

.craftify-stat-label {
  font-size: 0.73rem;
  line-height: 1.2;
  color: var(--vp-c-text-2);
  text-transform: lowercase;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .craftify-stats {
    grid-template-columns: 1fr;
    max-width: 360px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .craftify-stat {
    transition: none;
  }
}
</style>
