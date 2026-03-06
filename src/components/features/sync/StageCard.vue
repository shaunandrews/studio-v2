<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  url?: string
  favicon?: string
  connected: boolean
  envColor?: string
  dimmed?: boolean
  syncPhase?: 'idle' | 'syncing' | 'done' | 'error'
  syncPercent?: number
  syncLabel?: string
  syncDoneAt?: number
  syncDoneVerb?: string
}>(), {
  syncPhase: 'idle',
  syncPercent: 0,
  syncLabel: '',
})

defineEmits<{
  sync: []
  connect: []
}>()

// ── Relative time since sync completed ──

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

watch(() => props.syncPhase, (phase) => {
  if (phase === 'done') {
    now.value = Date.now()
    timer = setInterval(() => { now.value = Date.now() }, 1000)
  } else if (timer) {
    clearInterval(timer)
    timer = null
  }
}, { immediate: true })

onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const timeSince = computed(() => {
  if (!props.syncDoneAt) return ''
  const diff = Math.max(0, Math.floor((now.value - props.syncDoneAt) / 1000))
  if (diff < 60) return `${props.syncDoneVerb ?? 'Synced'} ${diff}s ago`
  if (diff < 3600) return `${props.syncDoneVerb ?? 'Synced'} ${Math.floor(diff / 60)}m ago`
  return `${props.syncDoneVerb ?? 'Synced'} ${Math.floor(diff / 3600)}h ago`
})
</script>

<template>
  <div
    class="sync-env"
    :class="{ 'sync-env--dimmed': dimmed }"
    :style="{ '--env-accent': envColor }"
  >
    <div class="sync-env__details" :class="{ 'sync-env__details--connected': connected }">
      <span class="sync-env__badge" :style="envColor ? { background: envColor } : undefined">{{ label }}</span>
      <span v-if="url && connected" class="sync-env__site">
        <img
          v-if="favicon"
          :src="favicon"
          class="sync-env__favicon"
          alt=""
        />
        <a
          :href="url.startsWith('http') ? url : `http://${url}`"
          class="sync-env__url"
          target="_blank"
          rel="noopener"
        >
          {{ url.replace(/^https?:\/\//, '') }}
        </a>
      </span>
    </div>

    <!-- Syncing: status text + progress bar -->
    <div v-if="syncPhase === 'syncing'" class="sync-env__status">
      <span class="sync-env__status-label">{{ syncLabel }}</span>
      <div class="sync-env__bar-track">
        <div class="sync-env__bar-fill" :style="{ width: `${syncPercent}%` }" />
      </div>
    </div>

    <!-- Done: time-since label -->
    <span v-else-if="syncPhase === 'done'" class="sync-env__timesince">{{ timeSince }}</span>

    <!-- Connected: Sync button -->
    <button
      v-if="connected && syncPhase !== 'syncing'"
      class="sync-env__action"
      @click="$emit('sync')"
    >
      Sync
    </button>

    <!-- Unconnected: connect button (only when not dimmed) -->
    <button
      v-if="!connected && !dimmed && syncPhase !== 'syncing'"
      class="sync-env__action"
      @click="$emit('connect')"
    >
      Connect site
    </button>
  </div>
</template>

<style scoped>
.sync-env {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-m);
  background: color-mix(in srgb, var(--env-accent, transparent) 5%, var(--color-frame-bg));
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.04);
  transition: opacity var(--duration-instant) var(--ease-default);
}

.sync-env--dimmed {
  opacity: 0.35;
  border-style: dashed;
  box-shadow: none;
}


.sync-env__site {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  min-width: 0;
}

.sync-env__favicon {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-s);
  flex-shrink: 0;
}

.sync-env__details {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  min-height: 22px;
  min-width: 0;
}

.sync-env__details--connected {
  flex-direction: row;
  align-items: center;
  justify-content: start;
  gap: var(--space-s);
}

.sync-env__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: rgba(0, 0, 0, 0.8);
  padding-inline: 4px;
  border-radius: var(--radius-s);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.sync-env__url {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  text-decoration: underline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-env__url:hover {
  text-decoration: none;
}

/* ── Action button ── */

.sync-env__action {
  flex-shrink: 0;
  height: 32px;
  padding-inline: 12px;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.sync-env__action:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

/* ── Syncing status ── */

.sync-env__status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding-inline-end: 12px;
}

.sync-env__status-label {
  font-size: var(--font-size-s);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

/* ── Progress bar ── */

.sync-env__bar-track {
  width: 120px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--color-frame-border);
  overflow: clip;
  flex-shrink: 0;
}

.sync-env__bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--color-frame-theme);
  transition: width 200ms var(--ease-default);
}

/* ── Time since ── */

.sync-env__timesince {
  font-size: var(--font-size-s);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
