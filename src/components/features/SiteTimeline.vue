<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Text from '@/components/primitives/Text.vue'
import { useRevisions } from '@/data/useRevisions'
import { useTasks } from '@/data/useTasks'

const props = defineProps<{
  siteId: string
}>()

const router = useRouter()
const { getRevisionsForSite } = useRevisions()
const { tasks } = useTasks()

const revisions = getRevisionsForSite(props.siteId)

const expandedIds = ref<Set<string>>(new Set())

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
  expandedIds.value = new Set(expandedIds.value)
}

function getTaskTitle(taskId: string): string {
  const task = tasks.value.find(t => t.id === taskId)
  return task?.title ?? 'Untitled task'
}

function navigateToTask(taskId: string) {
  router.push({ name: 'site-task', params: { id: props.siteId, taskId } })
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div v-if="revisions.length > 0" class="timeline">
    <Text variant="body-small" weight="semibold" class="timeline__heading">Recent changes</Text>
    <div class="timeline__list">
      <div
        v-for="rev in revisions"
        :key="rev.id"
        class="timeline-entry"
        :class="{ 'is-expanded': expandedIds.has(rev.id) }"
      >
        <div class="timeline-entry__dot" />
        <div class="timeline-entry__content">
          <button class="timeline-entry__header" @click="toggleExpand(rev.id)">
            <div class="timeline-entry__meta">
              <Text variant="body-small" class="timeline-entry__label">{{ rev.label }}</Text>
              <Text variant="caption" color="muted">{{ formatTime(rev.timestamp) }}</Text>
            </div>
            <button class="timeline-entry__task-link" @click.stop="navigateToTask(rev.taskId)">
              {{ getTaskTitle(rev.taskId) }}
            </button>
          </button>

          <!-- Expandable detail -->
          <div class="timeline-entry__detail-wrapper">
            <div class="timeline-entry__detail-collapse">
              <div class="timeline-entry__changes">
                <Text
                  v-for="(change, i) in rev.changes"
                  :key="i"
                  variant="caption"
                  color="muted"
                  tag="div"
                  class="timeline-entry__change"
                >
                  {{ change.label }}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
  background: var(--color-frame-fill);
  padding: var(--space-s);
  border-radius: var(--radius-l);
}

.timeline__heading {
  color: var(--color-frame-fg-muted);
}

.timeline__list {
  display: flex;
  flex-direction: column;
  position: relative;
  padding-inline-start: var(--space-m);
}

/* Vertical line */
.timeline__list::before {
  content: '';
  position: absolute;
  inset-inline-start: 5px;
  inset-block: 0;
  width: 2px;
  background: var(--color-frame-border);
  border-radius: 1px;
}

.timeline-entry {
  display: flex;
  gap: var(--space-xs);
  position: relative;
}

.timeline-entry__dot {
  position: absolute;
  inset-inline-start: calc(-1 * var(--space-m) + 2px);
  inset-block-start: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-frame-border);
  flex-shrink: 0;
  z-index: 1;
}

.timeline-entry__content {
  flex: 1;
  min-width: 0;
  padding-block: var(--space-xs);
}

.timeline-entry__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  text-align: start;
  font-family: inherit;
  width: 100%;
}

.timeline-entry__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-xs);
}

.timeline-entry__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-entry__task-link {
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-frame-theme);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: start;
}

.timeline-entry__task-link:hover {
  text-decoration: underline;
}

/* Expandable detail */
.timeline-entry__detail-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-moderate) var(--ease-default);
}

.timeline-entry.is-expanded .timeline-entry__detail-wrapper {
  grid-template-rows: 1fr;
}

.timeline-entry__detail-collapse {
  min-height: 0;
  overflow: hidden;
}

.timeline-entry__changes {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-block-start: var(--space-xxs);
  padding-inline-start: var(--space-xs);
  border-inline-start: 2px solid var(--color-frame-border);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.timeline-entry.is-expanded .timeline-entry__changes {
  opacity: 1;
}

.timeline-entry__change {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
