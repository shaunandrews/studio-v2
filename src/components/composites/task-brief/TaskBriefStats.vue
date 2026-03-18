<script setup lang="ts">
import { ref, computed } from 'vue'
import Text from '@/components/primitives/Text.vue'
import type { ChangedFile, ChangedEntity } from '@/data/types'

const props = defineProps<{
  changedFiles?: ChangedFile[]
  changedEntities?: ChangedEntity[]
  compact?: boolean
}>()

const filesOpen = ref(false)
const entitiesOpen = ref(false)

const fileCount = computed(() => props.changedFiles?.length ?? 0)
const entityCount = computed(() => props.changedEntities?.length ?? 0)

const compactStats = computed(() => {
  const parts: string[] = []
  if (fileCount.value > 0) parts.push(`${fileCount.value} ${fileCount.value === 1 ? 'file' : 'files'}`)
  if (entityCount.value > 0) parts.push(`${entityCount.value} ${entityCount.value === 1 ? 'item' : 'items'}`)
  return parts.join(' · ')
})

const entitySummary = computed(() => {
  if (!props.changedEntities?.length) return ''
  const counts: Record<string, number> = {}
  for (const e of props.changedEntities) {
    counts[e.entityType] = (counts[e.entityType] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([type, n]) => `${n} ${n === 1 ? type : type + 's'}`)
    .join(', ')
})

function fileTypeLabel(file: ChangedFile) {
  if (file.type === 'added') return '+'
  if (file.type === 'deleted') return '−'
  return '~'
}
</script>

<template>
  <!-- Compact: single stats line -->
  <div v-if="compact" class="brief-stats-compact">
    <Text v-if="compactStats" variant="body-small" color="muted">{{ compactStats }}</Text>
    <Text v-else variant="body-small" color="muted">No changes yet</Text>
  </div>

  <!-- Expanded: two-column grid -->
  <div v-else class="brief-stats-expanded">
    <!-- Files -->
    <div v-if="fileCount > 0" class="brief-stat-group">
      <button
        class="brief-stat-header hstack gap-xxxs"
        :aria-expanded="filesOpen"
        @click="filesOpen = !filesOpen"
      >
        <span class="brief-stat-chevron" :class="{ 'is-open': filesOpen }" aria-hidden="true">›</span>
        <Text variant="body-small" weight="medium">
          {{ fileCount }} {{ fileCount === 1 ? 'file' : 'files' }} changed
        </Text>
      </button>
      <ul v-if="filesOpen" class="brief-stat-list">
        <li v-for="file in changedFiles" :key="file.path" class="brief-stat-item hstack gap-xxs">
          <span class="brief-stat-type" :data-type="file.type" aria-hidden="true">{{ fileTypeLabel(file) }}</span>
          <Text variant="body-small" color="secondary" class="brief-stat-path">{{ file.path }}</Text>
        </li>
      </ul>
    </div>

    <!-- Entities -->
    <div v-if="entityCount > 0" class="brief-stat-group">
      <button
        class="brief-stat-header hstack gap-xxxs"
        :aria-expanded="entitiesOpen"
        @click="entitiesOpen = !entitiesOpen"
      >
        <span class="brief-stat-chevron" :class="{ 'is-open': entitiesOpen }" aria-hidden="true">›</span>
        <Text variant="body-small" weight="medium">{{ entitySummary }}</Text>
      </button>
      <ul v-if="entitiesOpen" class="brief-stat-list">
        <li
          v-for="entity in changedEntities"
          :key="`${entity.name}::${entity.entityType}::${entity.action}`"
          class="brief-stat-item hstack gap-xxs"
        >
          <Text variant="body-small" color="muted" class="brief-stat-entity-type">{{ entity.entityType }}</Text>
          <Text variant="body-small" color="secondary">{{ entity.name }}</Text>
        </li>
      </ul>
    </div>

    <Text v-if="fileCount === 0 && entityCount === 0" variant="body-small" color="muted" class="brief-stats-empty">No changes yet</Text>
  </div>
</template>

<style scoped>
.brief-stats-compact {
  padding-block: var(--space-xxxs);
}

/* Two-column grid for expanded state */
.brief-stats-expanded {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
}

/* When only one group is present (v-if), span full width */
.brief-stat-group:only-child {
  grid-column: 1 / -1;
}

/* "No changes yet" fallback spans both columns */
.brief-stats-empty {
  grid-column: 1 / -1;
}

/* Stat group header button */
.brief-stat-header {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  border-radius: var(--radius-s);
  padding: var(--space-xxxs) var(--space-xxs);
  margin-inline-start: calc(-1 * var(--space-xxs));
}

.brief-stat-header:hover {
  background: var(--color-frame-hover);
}

.brief-stat-header:focus-visible {
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 1px; /* Intentional exception: 1px optical offset for focus ring */
}

.brief-stat-chevron {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  transition: transform var(--duration-fast) var(--ease-out);
  line-height: 1;
  display: inline-block;
}

.brief-stat-chevron.is-open {
  transform: rotate(90deg);
}

/* List */
.brief-stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  padding-inline-start: var(--space-s);
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  margin-block-start: var(--space-xxxs);
}

/* File change type indicator (+/−/~) */
.brief-stat-type {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-semibold);
  width: var(--space-s); /* 12px = one character-width in monospace */
  text-align: center;
  flex-shrink: 0;
}

.brief-stat-type[data-type="added"]    { color: var(--color-brief-file-added); }
.brief-stat-type[data-type="deleted"]  { color: var(--color-brief-file-deleted); }
.brief-stat-type[data-type="modified"] { color: var(--color-frame-fg-muted); }

.brief-stat-path {
  font-family: var(--font-family-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brief-stat-entity-type {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em; /* Intentional: slightly tighter than heading-small (0.05em) for compact entity labels */
  flex-shrink: 0;
}
</style>
