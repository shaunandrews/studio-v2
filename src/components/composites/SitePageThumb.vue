<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <div class="site-page-thumb">
    <iframe
      :srcdoc="html"
      class="site-page-thumb__iframe"
      sandbox="allow-same-origin"
      loading="lazy"
      tabindex="-1"
    />
  </div>
</template>

<style scoped>
.site-page-thumb {
  width: 160px;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}

.site-page-thumb__iframe {
  width: 800px;
  height: 534px;
  border: none;
  transform-origin: top left;
  transform: scale(0.2);
  pointer-events: none;
}
</style>
