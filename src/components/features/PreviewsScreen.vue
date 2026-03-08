<script setup lang="ts">
import { computed, ref } from 'vue'
import { plus } from '@wordpress/icons'
import { useSites } from '@/data/useSites'
import { usePreviews } from '@/data/usePreviews'
import Button from '@/components/primitives/Button.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import PreviewsEmptyState from './previews/PreviewsEmptyState.vue'
import PreviewCard from './previews/PreviewCard.vue'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const {
  getPreviews,
  activeOperation,
  createPreview,
  deletePreview,
  clearPreview,
  extendPreview,
} = usePreviews()

const previews = getPreviews(props.siteId)
const createOp = computed(() => activeOperation(props.siteId).value)
const site = computed(() => sites.value.find(p => p.id === props.siteId))
const hasPreviews = computed(() => previews.value.length > 0)

// --- Celebration ---

const COLORS = ['#3858e9', '#5b7bf3', '#1fd15b', '#f2d76b', '#e65054', '#a855f7']

const confetti = ref<Array<{
  id: number
  x: string
  spread: number
  fall: number
  delay: number
  color: string
  size: number
  spin: number
}>>([])

function onCreated(url: string) {
  navigator.clipboard.writeText(`https://${url}`)

  // Spawn confetti
  const pieces = []
  for (let i = 0; i < 24; i++) {
    pieces.push({
      id: i,
      x: `${35 + Math.random() * 30}%`,
      spread: -120 + Math.random() * 240,
      fall: 60 + Math.random() * 100,
      delay: Math.random() * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 4,
      spin: -360 + Math.random() * 720,
    })
  }
  confetti.value = pieces
  setTimeout(() => { confetti.value = [] }, 2000)
}

// --- Actions ---

function handleCreate() {
  createPreview(props.siteId, site.value?.name ?? 'Site')
}

function handleDelete(previewId: string) {
  deletePreview(previewId)
}

function handleExtend(previewId: string) {
  extendPreview(previewId)
}

function handleClear(previewId: string) {
  clearPreview(previewId)
}
</script>

<template>
  <PreviewsEmptyState v-if="!hasPreviews" @create="handleCreate" />

  <ScreenLayout v-else>
    <div class="previews-list__header">
      <Button
        variant="primary"
        :icon="plus"
        label="New preview"
        size="small"
        :disabled="!!createOp"
        @click="handleCreate"
      />
    </div>

    <div class="previews-list vstack gap-xxl">
      <PreviewCard
        v-for="preview in previews"
        :key="preview.id"
        :preview="preview"
        :site-id="siteId"
        @created="onCreated"
        @delete="handleDelete(preview.id)"
        @extend="handleExtend(preview.id)"
        @clear="handleClear(preview.id)"
      />

      <!-- Confetti -->
      <div v-if="confetti.length" class="confetti" aria-hidden="true">
        <span
          v-for="p in confetti"
          :key="p.id"
          class="confetti__piece"
          :style="{
            '--x': p.x,
            '--spread': `${p.spread}px`,
            '--fall': `${p.fall}px`,
            '--delay': `${p.delay}s`,
            '--color': p.color,
            '--size': `${p.size}px`,
            '--spin': `${p.spin}deg`,
          }"
        />
      </div>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.previews-list__header {
  display: flex;
  justify-content: flex-end;
  margin-block-end: var(--space-m);
}

.previews-list {
  position: relative;
}

/* ── Confetti ── */

.confetti {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 0;
  height: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 10;
}

.confetti__piece {
  position: absolute;
  inset-inline-start: var(--x);
  inset-block-start: 0;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 1px;
  animation: confetti-pop 1.2s ease-out var(--delay) both;
}

@keyframes confetti-pop {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(calc(var(--spread) * 0.3), -30px) rotate(calc(var(--spin) * 0.2)) scale(1);
  }
  100% {
    transform: translate(var(--spread), var(--fall)) rotate(var(--spin)) scale(0.4);
    opacity: 0;
  }
}
</style>
