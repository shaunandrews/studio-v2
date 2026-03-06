<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { plus } from '@wordpress/icons'
import { useSites } from '@/data/useSites'
import { usePreviews } from '@/data/usePreviews'
import Button from '@/components/primitives/Button.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import PreviewsEmptyState from './previews/PreviewsEmptyState.vue'
import PreviewCard from './previews/PreviewCard.vue'
import ProgressCard from './previews/ProgressCard.vue'

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
const hasPreviews = computed(() => previews.value.length > 0 || !!createOp.value)

// --- Celebration ---

const COLORS = ['#3858e9', '#5b7bf3', '#1fd15b', '#f2d76b', '#e65054', '#a855f7']

const justCreatedId = ref<string | null>(null)
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

function celebrate() {
  const pieces = []
  for (let i = 0; i < 24; i++) {
    pieces.push({
      id: i,
      x: `${40 + Math.random() * 20}%`,
      spread: -100 + Math.random() * 200,
      fall: 80 + Math.random() * 120,
      delay: Math.random() * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 4,
      spin: -360 + Math.random() * 720,
    })
  }
  confetti.value = pieces
  setTimeout(() => { confetti.value = [] }, 2000)
}

// When createOp goes from something → null, creation just finished
watch(createOp, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    nextTick(() => {
      const newest = previews.value
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      if (newest) {
        justCreatedId.value = newest.id
        navigator.clipboard.writeText(`https://${newest.url}`)
        celebrate()
        setTimeout(() => { justCreatedId.value = null }, 1500)
      }
    })
  }
})

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

  <ScreenLayout
    v-else
    title="Preview sites"
    subtitle="Share a hosted preview of your site for feedback."
  >
    <template #actions>
      <Button
        variant="primary"
        :icon="plus"
        label="New preview"
        size="small"
        :disabled="!!createOp"
        @click="handleCreate"
      />
    </template>

    <div class="previews-list vstack gap-xxl">
      <Transition name="progress">
        <ProgressCard v-if="createOp" :operation="createOp" />
      </Transition>

      <PreviewCard
        v-for="preview in previews"
        :key="preview.id"
        :preview="preview"
        :site-id="siteId"
        :class="{ 'is-just-created': justCreatedId === preview.id }"
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
.previews-list {
  position: relative;
}

/* ── Progress card enter/leave ── */

.progress-enter-active {
  transition: opacity var(--duration-slow) var(--ease-out),
              transform var(--duration-slow) var(--ease-out);
}

.progress-leave-active {
  transition: opacity var(--duration-moderate) var(--ease-in),
              transform var(--duration-moderate) var(--ease-in);
}

.progress-enter-from {
  opacity: 0;
  transform: translateY(var(--space-xs)) scale(0.98);
}

.progress-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

/* ── Just-created card glow ── */

.is-just-created {
  animation: card-glow 1.2s var(--ease-out) both;
}

@keyframes card-glow {
  0% {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-frame-theme) 30%, transparent);
  }
  100% {
    box-shadow: 0 0 0 3px transparent;
  }
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
  animation: confetti-pop 1.2s var(--ease-out) var(--delay) both;
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
