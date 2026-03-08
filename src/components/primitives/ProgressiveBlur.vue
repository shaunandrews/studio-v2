<script setup lang="ts">
defineProps<{
  direction?: 'up' | 'down'
  height?: string
}>()
</script>

<template>
  <div
    class="progressive-blur"
    :class="`progressive-blur--${direction ?? 'up'}`"
    :style="{ '--blur-height': height }"
    aria-hidden="true"
  >
    <div class="progressive-blur__layer" v-for="i in 4" :key="i" />
  </div>
</template>

<style scoped>
.progressive-blur {
  position: absolute;
  inset-inline: 0;
  block-size: var(--blur-height, 48px);
  pointer-events: none;
}

.progressive-blur--up {
  inset-block-end: 0;
}

.progressive-blur--down {
  inset-block-start: 0;
}

.progressive-blur__layer {
  position: absolute;
  inset: 0;
}

/* ── Up direction (fade content above) ── */

.progressive-blur--up .progressive-blur__layer:nth-child(1) {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  mask-image: linear-gradient(to bottom, transparent, black);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black);
}

.progressive-blur--up .progressive-blur__layer:nth-child(2) {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  mask-image: linear-gradient(to bottom, transparent 20%, black 60%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 20%, black 60%);
}

.progressive-blur--up .progressive-blur__layer:nth-child(3) {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  mask-image: linear-gradient(to bottom, transparent 40%, black 80%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 40%, black 80%);
}

.progressive-blur--up .progressive-blur__layer:nth-child(4) {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  mask-image: linear-gradient(to bottom, transparent 60%, black 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 60%, black 100%);
}

/* ── Down direction (fade content below) ── */

.progressive-blur--down .progressive-blur__layer:nth-child(1) {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  mask-image: linear-gradient(to top, transparent, black);
  -webkit-mask-image: linear-gradient(to top, transparent, black);
}

.progressive-blur--down .progressive-blur__layer:nth-child(2) {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  mask-image: linear-gradient(to top, transparent 20%, black 60%);
  -webkit-mask-image: linear-gradient(to top, transparent 20%, black 60%);
}

.progressive-blur--down .progressive-blur__layer:nth-child(3) {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  mask-image: linear-gradient(to top, transparent 40%, black 80%);
  -webkit-mask-image: linear-gradient(to top, transparent 40%, black 80%);
}

.progressive-blur--down .progressive-blur__layer:nth-child(4) {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  mask-image: linear-gradient(to top, transparent 60%, black 100%);
  -webkit-mask-image: linear-gradient(to top, transparent 60%, black 100%);
}
</style>
