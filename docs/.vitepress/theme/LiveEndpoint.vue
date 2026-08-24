<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{
  url: string;
  method?: string;
  raw?: boolean;
}>();

type State = 'loading' | 'ok' | 'empty' | 'error';

const state = ref<State>('loading');
const status = ref<number | null>(null);
const body = ref('');

onMounted(async () => {
  try {
    const res = await fetch(props.url, { method: props.method ?? 'GET' });
    status.value = res.status;

    if (res.status === 204) {
      state.value = 'empty';
      return;
    }

    if (props.raw) {
      body.value = await res.text();
    } else {
      const json = await res.json();
      body.value = JSON.stringify(json, null, 2);
    }

    state.value = res.ok ? 'ok' : 'error';
  } catch {
    state.value = 'error';
  }
});
</script>

<template>
  <div class="craftify-live">
    <div class="craftify-live-head">
      <span
        class="craftify-live-dot"
        :class="state"
      ></span>
      <span class="craftify-live-label">LIVE REQUEST</span>
      <span
        v-if="status"
        class="craftify-live-status"
        >{{ status }}</span
      >
      <a
        :href="url"
        target="_blank"
        rel="noopener"
        class="craftify-live-link"
        >open raw</a
      >
    </div>

    <pre
      v-if="state === 'loading'"
      class="craftify-live-body craftify-live-loading"
    >
fetching {{ url }} ...</pre>
    <pre
      v-else-if="state === 'empty'"
      class="craftify-live-body"
    >
204 No Content, no data for this request</pre>
    <pre
      v-else-if="state === 'error'"
      class="craftify-live-body craftify-live-error"
    >
request failed or blocked in this browser. open the raw link above to view it directly.</pre>
    <pre
      v-else
      class="craftify-live-body"
      >{{ body }}</pre>
  </div>
</template>

<style scoped>
.craftify-live {
  border: 1px solid var(--vp-c-divider);
  margin: 24px 0;
  background: var(--vp-code-block-bg);
}

.craftify-live-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.craftify-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  flex-shrink: 0;
}

.craftify-live-dot.loading {
  background: var(--vp-c-text-3);
  animation: craftify-pulse 1s ease-in-out infinite;
}

.craftify-live-dot.ok {
  background: var(--craftify-accent);
  box-shadow: 0 0 8px var(--craftify-accent);
}

.craftify-live-dot.empty {
  background: var(--vp-c-text-3);
}

.craftify-live-dot.error {
  background: var(--craftify-accent);
}

@keyframes craftify-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.craftify-live-label {
  color: var(--vp-c-text-2);
}

.craftify-live-status {
  color: var(--vp-c-text-1);
  font-weight: 700;
}

.craftify-live-link {
  margin-left: auto;
  color: var(--vp-c-text-3);
  text-decoration: none;
  border: 1px solid var(--vp-c-divider);
  padding: 1px 8px;
  transition:
    color 0.15s linear,
    border-color 0.15s linear;
}

.craftify-live-link:hover {
  color: var(--craftify-accent);
  border-color: var(--craftify-accent);
}

.craftify-live-body {
  margin: 0;
  padding: 14px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  color: var(--vp-c-text-1);
}

.craftify-live-loading {
  color: var(--vp-c-text-3);
}

.craftify-live-error {
  color: var(--craftify-accent);
  white-space: pre-wrap;
}
</style>
