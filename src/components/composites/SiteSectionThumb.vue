<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  html: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const contentHeight = ref(60) // default min height at thumb scale

function measureHeight() {
  const iframe = iframeRef.value
  if (!iframe) return
  try {
    const doc = iframe.contentDocument
    if (!doc?.body) return
    const h = doc.body.scrollHeight
    // Scale: iframe renders at 800px, thumb is 160px → 0.2 scale
    contentHeight.value = Math.max(20, h * 0.2)
  } catch { /* cross-origin fallback */ }
}

function onLoad() {
  measureHeight()
}

onMounted(() => {
  // Also measure after a delay for fonts/images
  setTimeout(measureHeight, 300)
})

watch(() => props.html, () => {
  setTimeout(measureHeight, 200)
})
</script>

<template>
  <div class="site-section-thumb" :style="{ height: contentHeight + 'px' }">
    <iframe
      ref="iframeRef"
      :srcdoc="html"
      class="site-section-thumb__iframe"
      sandbox="allow-same-origin"
      loading="lazy"
      tabindex="-1"
      @load="onLoad"
    />
  </div>
</template>

<style scoped>
.site-section-thumb {
  width: 160px;
  overflow: hidden;
  background: white;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 3px var(--color-shadow);
}

@media (prefers-color-scheme: dark) {
  .site-section-thumb {
    background: #2c2c2c;
  }
}

.site-section-thumb__iframe {
  width: 800px;
  height: 5000px; /* tall enough for any section content */
  border: none;
  transform-origin: top left;
  transform: scale(0.2);
  pointer-events: none;
}
</style>
