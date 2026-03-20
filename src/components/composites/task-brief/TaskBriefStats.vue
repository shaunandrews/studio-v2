<script setup lang="ts">
import { computed } from 'vue'
import Text from '@/components/primitives/Text.vue'
import type { ChangedFile, ChangedEntity } from '@/data/types'

const props = defineProps<{
  changedFiles?: ChangedFile[]
  changedEntities?: ChangedEntity[]
}>()

const fileCount = computed(() => props.changedFiles?.length ?? 0)
const entityCount = computed(() => props.changedEntities?.length ?? 0)

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
  <div class="brief-stats">
    <!-- Files -->
    <div v-if="fileCount > 0" class="brief-stat-group">
      <Text variant="body-small" weight="medium">
        {{ fileCount }} {{ fileCount === 1 ? 'file' : 'files' }} changed
      </Text>
      <ul class="brief-stat-list vstack gap-xxxs">
        <li v-for="file in changedFiles" :key="file.path" class="brief-stat-item hstack gap-xxs">
          <span class="brief-stat-type" :data-type="file.type" aria-hidden="true">{{ fileTypeLabel(file) }}</span>
          <Text variant="body-small" color="secondary" class="brief-stat-path">{{ file.path }}</Text>
        </li>
      </ul>
    </div>

    <!-- Entities -->
    <div v-if="entityCount > 0" class="brief-stat-group">
      <Text variant="body-small" weight="medium">{{ entitySummary }}</Text>
      <ul class="brief-stat-list vstack gap-xxxs">
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

    <Text v-if="fileCount === 0 && entityCount === 0" variant="body-small" color="muted">No changes yet</Text>
  </div>
</template>

<style scoped>
.brief-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
}

.brief-stat-group:only-child {
  grid-column: 1 / -1;
}

/* List */
.brief-stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  padding-inline-start: var(--space-s);
  margin-block-start: var(--space-xxxs);
}

/* File change type indicator (+/−/~) */
.brief-stat-type {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-semibold);
  width: var(--space-s);
  text-align: center;
  flex-shrink: 0;
}

.brief-stat-type[data-type="added"]    { color: var(--color-status-running); }
.brief-stat-type[data-type="deleted"]  { color: var(--color-frame-danger); }
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
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
</style>
