<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Button from '@/components/primitives/Button.vue'

const props = defineProps<{
  open: boolean
  actionLabel: string
  verb: 'push' | 'pull' | 'promote'
  progress: { phase: 'idle' | 'syncing' | 'done' | 'error'; percent: number; label: string }
}>()

const emit = defineEmits<{
  close: []
  start: []
}>()

const categories = ref([
  { id: 'plugins', label: 'Plugins', count: 12, checked: true },
  { id: 'themes', label: 'Themes', count: 3, checked: true },
  { id: 'uploads', label: 'Uploads', count: 148, checked: true },
  { id: 'database', label: 'Database', count: null as number | null, checked: true },
  { id: 'wpconfig', label: 'wp-config.php', count: null as number | null, checked: false },
])

const summary = computed(() => {
  const checked = categories.value.filter(c => c.checked)
  const fileCount = checked.reduce((sum, c) => sum + (c.count ?? 0), 0)
  const hasDb = checked.some(c => c.id === 'database')
  const parts: string[] = []
  if (fileCount > 0) parts.push(`${fileCount} files`)
  if (hasDb) parts.push('1 database')
  return parts.join(', ') || 'Nothing selected'
})

const buttonLabel = computed(() => {
  if (props.verb === 'pull') return 'Pull'
  if (props.verb === 'promote') return 'Promote'
  return 'Push'
})

// Reset checkboxes when panel opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    categories.value.forEach(c => {
      c.checked = c.id !== 'wpconfig'
    })
  }
})

// Escape key handler
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="panel">
    <div v-if="open" class="sync-panel-wrapper">
      <div class="sync-panel__backdrop" @click="emit('close')" />
      <div class="sync-panel">
        <!-- Header -->
        <div class="sync-panel__header">
          <span class="sync-panel__title">{{ actionLabel }}</span>
          <button class="sync-panel__close" @click="emit('close')">&times;</button>
        </div>

        <!-- Idle state: checklist -->
        <div v-if="progress.phase === 'idle'" class="sync-panel__body">
          <div class="sync-panel__section-label">What to sync:</div>
          <label
            v-for="cat in categories"
            :key="cat.id"
            class="sync-panel__category"
          >
            <input v-model="cat.checked" type="checkbox" class="sync-panel__checkbox" />
            <span class="sync-panel__cat-label">{{ cat.label }}</span>
            <span v-if="cat.count" class="sync-panel__cat-count">{{ cat.count }}</span>
          </label>
          <div class="sync-panel__divider" />
          <div class="sync-panel__summary">{{ summary }}</div>
        </div>

        <!-- Syncing state: progress -->
        <div v-else-if="progress.phase === 'syncing'" class="sync-panel__body sync-panel__body--progress">
          <div class="sync-panel__progress-label">{{ progress.label }}</div>
          <div class="sync-panel__progress-track">
            <div class="sync-panel__progress-fill" :style="{ width: `${progress.percent}%` }" />
          </div>
          <div class="sync-panel__progress-percent">{{ progress.percent }}%</div>
        </div>

        <!-- Done state -->
        <div v-else-if="progress.phase === 'done'" class="sync-panel__body sync-panel__body--done">
          <div class="sync-panel__done-icon">&check;</div>
          <div class="sync-panel__done-label">{{ progress.label }}</div>
        </div>

        <!-- Footer -->
        <div class="sync-panel__footer">
          <Button
            v-if="progress.phase === 'idle'"
            variant="primary"
            :label="buttonLabel"
            width="full"
            @click="emit('start')"
          />
          <Button
            v-else-if="progress.phase === 'done'"
            variant="secondary"
            label="Close"
            width="full"
            @click="emit('close')"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sync-panel-wrapper {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
}

.sync-panel__backdrop {
  flex: 1;
  background: rgba(0, 0, 0, 0.05);
}

.sync-panel {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-frame-bg);
  border-inline-start: 1px solid var(--color-frame-border);
  box-shadow: -4px 0 12px var(--color-shadow);
}

.sync-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-m);
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.sync-panel__title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.sync-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-size: 18px;
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.sync-panel__close:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}

.sync-panel__body {
  flex: 1;
  padding: var(--space-m);
  overflow-y: auto;
}

.sync-panel__section-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-block-end: var(--space-s);
}

.sync-panel__category {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  height: 36px;
  cursor: pointer;
}

.sync-panel__checkbox {
  accent-color: var(--color-primary);
}

.sync-panel__cat-label {
  flex: 1;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
}

.sync-panel__cat-count {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  font-variant-numeric: tabular-nums;
}

.sync-panel__divider {
  height: 1px;
  background: var(--color-frame-border);
  margin-block: var(--space-m);
}

.sync-panel__summary {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
}

/* ── Progress state ── */

.sync-panel__body--progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-s);
}

.sync-panel__progress-label {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
}

.sync-panel__progress-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-frame-bg-secondary);
  overflow: hidden;
}

.sync-panel__progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--color-primary);
  transition: width 200ms var(--ease-default);
}

.sync-panel__progress-percent {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  font-variant-numeric: tabular-nums;
}

/* ── Done state ── */

.sync-panel__body--done {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-s);
}

.sync-panel__done-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-status-running);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.sync-panel__done-label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.sync-panel__footer {
  padding: var(--space-m);
  border-block-start: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

/* ── Transition ── */

.panel-enter-active,
.panel-leave-active {
  transition: opacity 200ms var(--ease-default);
}

.panel-enter-active .sync-panel,
.panel-leave-active .sync-panel {
  transition: transform 200ms var(--ease-default);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .sync-panel,
.panel-leave-to .sync-panel {
  transform: translateX(100%);
}
</style>
