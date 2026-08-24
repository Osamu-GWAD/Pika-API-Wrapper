<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const progress = ref(0);

function updateProgress(): void {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  progress.value = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
}

onMounted(() => {
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateProgress);
  window.removeEventListener('resize', updateProgress);
});
</script>

<template>
  <div
    class="craftify-scroll-progress"
    :style="{ '--craftify-scroll-progress': `${progress}%` }"
    aria-hidden="true"
  />
</template>
