<script setup lang="ts">
import { computed, ref } from 'vue'
import { moreVertical } from '@wordpress/icons'
import { useSites } from '@/data/useSites'
import { usePreviews } from '@/data/usePreviews'
import Button from '@/components/primitives/Button.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import Pane from '@/components/composites/Pane.vue'
import PreviewsEmptyState from './previews/PreviewsEmptyState.vue'
import PreviewCard from './previews/PreviewCard.vue'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const {
  getPreviews,
  getExpiration,
  activeOperation,
  createPreview,
  deletePreview,
  clearPreview,
} = usePreviews()

const previews = getPreviews(props.siteId)
const createOp = computed(() => activeOperation(props.siteId).value)
const site = computed(() => sites.value.find(p => p.id === props.siteId))
const hasPreviews = computed(() => previews.value.length > 0)

// --- List options ---

const showExpired = ref(true)
const sortNewestFirst = ref(true)

const filteredPreviews = computed(() => {
  let list = previews.value
  if (!showExpired.value) {
    list = list.filter(p => {
      if (p.status === 'deleted') return false
      return !getExpiration(p.updatedAt).isExpired
    })
  }
  return [...list].sort((a, b) => {
    const aExpiry = new Date(getExpiration(a.updatedAt).expiresAt).getTime()
    const bExpiry = new Date(getExpiration(b.updatedAt).expiresAt).getTime()
    return sortNewestFirst.value ? bExpiry - aExpiry : aExpiry - bExpiry
  })
})

const optionsMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      {
        label: 'Show expired',
        checked: showExpired.value,
        action: () => { showExpired.value = !showExpired.value },
      },
    ],
  },
  {
    label: 'Sort',
    items: [
      {
        label: 'Newest first',
        checked: sortNewestFirst.value,
        action: () => { sortNewestFirst.value = true },
      },
      {
        label: 'Oldest first',
        checked: !sortNewestFirst.value,
        action: () => { sortNewestFirst.value = false },
      },
    ],
  },
])

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

function handleClear(previewId: string) {
  clearPreview(previewId)
}
</script>

<template>
  <PreviewsEmptyState v-if="!hasPreviews" @create="handleCreate" />

  <Pane v-else :scrollable="false" centered>
    <div class="previews-list__header ps-xl pe-s mb-xl">
      <span class="previews-list__description">Share your site with collaborators and clients</span>
      <div class="hstack gap-xxs">
        <Button
          variant="primary"
          label="New preview"
          size="small"
          :disabled="!!createOp"
          @click="handleCreate"
        />
        <FlyoutMenu :groups="optionsMenuGroups" align="end">
          <template #trigger="{ toggle }">
            <Button
              variant="tertiary"
              :icon="moreVertical"
              icon-only
              size="small"
              tooltip="List options"
              @click="toggle"
            />
          </template>
        </FlyoutMenu>
      </div>
    </div>

    <div class="previews-list vstack gap-xxl">
      <PreviewCard
        v-for="preview in filteredPreviews"
        :key="preview.id"
        :preview="preview"
        :site-id="siteId"
        @created="onCreated"
        @delete="handleDelete(preview.id)"
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
  </Pane>
</template>

<style scoped>
.previews-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.previews-list__description {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
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
