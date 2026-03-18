# Task Brief Card Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the thin `TaskToolbar` with a skeuomorphic paper-brief card that shows task title, AI summary, file/entity change stats, and status-driven visual treatments.

**Architecture:** Four new components in `src/components/composites/task-brief/` — a root `TaskBrief.vue` with collapsed/expanded state, a `TaskBriefHeader.vue` for the status band, a `TaskBriefStats.vue` for files and entities, and a `TaskBriefActions.vue` for Preview/Review buttons. New CSS vars for paper surface, status tints, and semantic dot/file/stamp colors are added to `colors.css`. The `Conversation` type gets three optional fields; seed data is updated to exercise all states.

**Tech Stack:** Vue 3 SFCs, scoped CSS, design system tokens (`src/styles/space.css`: xxxs=2, xxs=4, xs=8, s=12, m=16, l=20, xl=24, xxl=32, xxxl=48px), `@wordpress/icons` via `WPIcon`

---

## Chunk 1: Foundation — CSS Variables + Data Model + Seed Data

### Task 1: CSS Variables

**Files:**
- Modify: `src/styles/colors.css`

- [ ] **Step 1: Add all new variables to the light-mode `:root` block**

Open `src/styles/colors.css`. After the existing `--shadow-m` line (line 53), add:

```css
  /* Paper surface (Task Brief card) */
  --color-paper: #faf9f7;
  --color-paper-header: #f0ede8;
  --color-paper-rule: rgba(0, 0, 0, 0.07);
  --color-paper-dog-ear: #ddd9d1;
  --color-paper-shadow: rgba(0, 0, 0, 0.08);

  /* Task Brief status band tints */
  --color-brief-idle: #e8e8e8;
  --color-brief-running: #fef3c7;
  --color-brief-review: #dbeafe;
  --color-brief-approved: #dcfce7;
  --color-brief-merged: #dcfce7;
  --color-brief-rejected: #fee2e2;

  /* Task Brief status dot colors */
  --color-brief-dot-idle: var(--color-frame-fg-muted);
  --color-brief-dot-running: #d97706;
  --color-brief-dot-review: #2563eb;
  --color-brief-dot-approved: #16a34a;
  --color-brief-dot-rejected: #dc2626;

  /* Task Brief file change type colors */
  --color-brief-file-added: #16a34a;
  --color-brief-file-deleted: #dc2626;

  /* Task Brief stamp / watermark */
  --color-brief-stamp: #16a34a;
  --color-brief-watermark: #2563eb;
```

- [ ] **Step 2: Add dark-mode overrides to the `@media (prefers-color-scheme: dark)` block**

In the `@media (prefers-color-scheme: dark) { :root:not([data-color-scheme="light"]) }` block, after `--color-shadow`, add:

```css
    --color-paper: #2a2825;
    --color-paper-header: #222019;
    --color-paper-rule: rgba(255, 255, 255, 0.07);
    --color-paper-dog-ear: #1a1917;
    --color-paper-shadow: rgba(0, 0, 0, 0.3);

    --color-brief-idle: #3a3a3a;
    --color-brief-running: #3d2e0a;
    --color-brief-review: #0f2038;
    --color-brief-approved: #0f2e1a;
    --color-brief-merged: #0f2e1a;
    --color-brief-rejected: #2e0f0f;

    --color-brief-dot-running: #f59e0b;
    --color-brief-dot-review: #60a5fa;
    --color-brief-dot-approved: #4ade80;
    --color-brief-dot-rejected: #f87171;

    --color-brief-file-added: #4ade80;
    --color-brief-file-deleted: #f87171;

    --color-brief-stamp: #4ade80;
    --color-brief-watermark: #60a5fa;
```

- [ ] **Step 3: Add the same overrides to the `[data-color-scheme="dark"]` block**

The manual dark mode block at the bottom of `colors.css` (starting `:root[data-color-scheme="dark"]`) mirrors the media query block. Add the exact same variables from Step 2 there too, after `--color-shadow`.

- [ ] **Step 4: Verify the dev server picks up the changes without errors**

Run `npm run dev` and open `http://localhost:3025`. No console errors. Open DevTools and check that `--color-paper` resolves to `#faf9f7` in light mode.

- [ ] **Step 5: Commit**

```bash
git add src/styles/colors.css
git commit -m "feat: add paper surface and brief-status CSS variables"
```

---

### Task 2: Data Model

**Files:**
- Modify: `src/data/types.ts`

- [ ] **Step 1: Add `ChangedFile` and `ChangedEntity` interfaces**

After the `TaskWorktree` interface (line 88), add:

```typescript
export interface ChangedFile {
  path: string                   // e.g. "hero.html"
  type: 'added' | 'modified' | 'deleted'
}

export interface ChangedEntity {
  name: string                   // e.g. "Welcome to Our Site"
  entityType: string             // e.g. "post", "page", "option", "plugin"
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
}
```

- [ ] **Step 2: Add optional fields to `Conversation`**

In the `Conversation` interface, add three optional fields after `worktree?`:

```typescript
  summary?: string
  changedFiles?: ChangedFile[]
  changedEntities?: ChangedEntity[]
```

- [ ] **Step 3: Verify TypeScript compiles**

Run `npm run dev` — no TypeScript errors in the terminal.

- [ ] **Step 4: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: add summary, changedFiles, changedEntities to Conversation type"
```

---

### Task 3: Seed Data

**Files:**
- Modify: `src/data/seed-conversations.ts`

- [ ] **Step 1: Update `blog-assistant-1` (status: review)**

Find the entry and add:

```typescript
summary: 'Redesigned the hero section with new typography and layout. Next: update mobile breakpoints.',
changedFiles: [
  { path: 'style.css', type: 'modified' },
  { path: 'header.php', type: 'modified' },
  { path: 'hero-block.json', type: 'added' },
],
changedEntities: [
  { name: 'Home', entityType: 'page', action: 'updated' },
  { name: 'site_tagline', entityType: 'option', action: 'updated' },
],
```

- [ ] **Step 2: Update `blog-code-1` (status: merged)**

```typescript
summary: 'Built and registered a custom quote block with style variations.',
changedFiles: [
  { path: 'blocks/quote-block/block.json', type: 'added' },
  { path: 'blocks/quote-block/index.js', type: 'added' },
  { path: 'functions.php', type: 'modified' },
],
changedEntities: [
  { name: 'Quote Block', entityType: 'plugin', action: 'activated' },
],
```

- [ ] **Step 3: Update `cafe-photos` (status: approved)**

```typescript
summary: 'Replaced placeholder menu photos with high-res images and updated alt text.',
changedFiles: [
  { path: 'images/menu-espresso.jpg', type: 'added' },
  { path: 'images/menu-latte.jpg', type: 'added' },
  { path: 'menu-page.php', type: 'modified' },
],
changedEntities: [
  { name: 'Menu', entityType: 'page', action: 'updated' },
  { name: 'Our Coffee', entityType: 'post', action: 'updated' },
],
```

- [ ] **Step 4: Update `cafe-hero-tweak` to exercise running state**

Add a partial summary to any running conversation:

```typescript
summary: 'Updating homepage hero image and tagline copy...',
```

- [ ] **Step 5: Verify no TypeScript errors, commit**

```bash
git add src/data/seed-conversations.ts
git commit -m "feat: add summary and change data to seed conversations"
```

---

## Chunk 2: Sub-components

### Task 4: TaskBriefHeader

**Files:**
- Create: `src/components/composites/task-brief/TaskBriefHeader.vue`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/components/composites/task-brief
```

- [ ] **Step 2: Create `TaskBriefHeader.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import Text from '@/components/primitives/Text.vue'
import type { ConversationStatus } from '@/data/types'

const props = defineProps<{
  status: ConversationStatus
  branch?: string
}>()

const statusLabel: Record<ConversationStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  review: 'In Review',
  approved: 'Approved',
  merged: 'Merged',
  rejected: 'Rejected',
}

const label = computed(() => statusLabel[props.status])
</script>

<template>
  <div class="brief-header hstack justify-between" :data-status="status">
    <!-- Status badge -->
    <div class="brief-status hstack gap-xxxs">
      <span class="brief-status__dot" aria-hidden="true" />
      <Text variant="body-small" weight="medium" class="brief-status__label">{{ label }}</Text>
    </div>

    <!-- Branch name -->
    <Text v-if="branch" variant="body-small" class="brief-branch" :title="branch">
      {{ branch }}
    </Text>
  </div>
</template>

<style scoped>
.brief-header {
  padding-block: var(--space-xxs);
  padding-inline: var(--space-s);
  background: var(--color-brief-idle);
  border-start-start-radius: var(--radius-m);
  border-start-end-radius: var(--radius-m);
  transition: background var(--duration-moderate) var(--ease-out);
}

.brief-header[data-status="running"]  { background: var(--color-brief-running); }
.brief-header[data-status="review"]   { background: var(--color-brief-review); }
.brief-header[data-status="approved"] { background: var(--color-brief-approved); }
.brief-header[data-status="merged"]   { background: var(--color-brief-merged); }
.brief-header[data-status="rejected"] { background: var(--color-brief-rejected); }

/* Status dot */
.brief-status__dot {
  width: 6px; /* Intentional exception: 6px is the established dot size (StatusIndicator), not a spacing value */
  height: 6px;
  border-radius: 50%;
  background: var(--color-brief-dot-idle);
  flex-shrink: 0;
  transition: background var(--duration-moderate) var(--ease-out);
}

.brief-header[data-status="running"]  .brief-status__dot { background: var(--color-brief-dot-running); }
.brief-header[data-status="review"]   .brief-status__dot { background: var(--color-brief-dot-review); }
.brief-header[data-status="approved"] .brief-status__dot { background: var(--color-brief-dot-approved); }
.brief-header[data-status="merged"]   .brief-status__dot { background: var(--color-brief-dot-approved); }
.brief-header[data-status="rejected"] .brief-status__dot { background: var(--color-brief-dot-rejected); }

/* Running pulse animation on the dot */
@keyframes brief-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.brief-header[data-status="running"] .brief-status__dot {
  animation: brief-pulse 1800ms var(--ease-in-out) infinite;
}

/* Branch name */
.brief-branch {
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-inline-size: 200px;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/composites/task-brief/TaskBriefHeader.vue
git commit -m "feat: add TaskBriefHeader component"
```

---

### Task 5: TaskBriefStats

**Files:**
- Create: `src/components/composites/task-brief/TaskBriefStats.vue`

- [ ] **Step 1: Create `TaskBriefStats.vue`**

```vue
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
          :key="entity.name + entity.entityType"
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
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/composites/task-brief/TaskBriefStats.vue
git commit -m "feat: add TaskBriefStats component"
```

---

### Task 6: TaskBriefActions

**Files:**
- Create: `src/components/composites/task-brief/TaskBriefActions.vue`

- [ ] **Step 1: Create `TaskBriefActions.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { seen, code } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import type { ConversationStatus } from '@/data/types'

const props = defineProps<{
  previewUrl?: string
  status?: ConversationStatus
  compact?: boolean
}>()

const emit = defineEmits<{
  'preview': []
  'review': []
}>()

const isReview = computed(() => props.status === 'review')
</script>

<template>
  <!-- Compact: icon-only buttons -->
  <div v-if="compact" class="brief-actions-compact hstack gap-xxxs">
    <Tooltip v-if="previewUrl" :text="`Preview at ${previewUrl}`" placement="bottom">
      <Button :icon="seen" icon-only size="small" variant="tertiary" @click.stop="emit('preview')" />
    </Tooltip>
    <Tooltip text="Review changes" placement="bottom">
      <Button
        :icon="code"
        icon-only
        size="small"
        :variant="isReview ? 'secondary' : 'tertiary'"
        @click.stop="emit('review')"
      />
    </Tooltip>
  </div>

  <!-- Expanded: labelled buttons in footer -->
  <div v-else class="brief-actions-expanded hstack gap-xxs justify-end">
    <Tooltip v-if="previewUrl" :text="`Preview at ${previewUrl}`" placement="top">
      <Button :icon="seen" label="Preview" size="small" variant="tertiary" @click.stop="emit('preview')" />
    </Tooltip>
    <Button
      :icon="code"
      label="Review changes"
      size="small"
      :variant="isReview ? 'primary' : 'secondary'"
      @click.stop="emit('review')"
    />
  </div>
</template>
```

Note: `@click.stop` prevents the click from bubbling to the parent card's toggle handler.

- [ ] **Step 2: Commit**

```bash
git add src/components/composites/task-brief/TaskBriefActions.vue
git commit -m "feat: add TaskBriefActions component"
```

---

## Chunk 3: Root Card + Integration

### Task 7: TaskBrief (root card)

**Files:**
- Create: `src/components/composites/task-brief/TaskBrief.vue`

- [ ] **Step 1: Create `TaskBrief.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConversations } from '@/data/useConversations'
import TaskBriefHeader from './TaskBriefHeader.vue'
import TaskBriefStats from './TaskBriefStats.vue'
import TaskBriefActions from './TaskBriefActions.vue'
import Text from '@/components/primitives/Text.vue'

const props = defineProps<{
  conversationId: string
}>()

const emit = defineEmits<{
  'preview': [conversationId: string]
  'review': [conversationId: string]
}>()

const { conversations } = useConversations()

const conversation = computed(() =>
  conversations.value.find(c => c.id === props.conversationId)
)

const title = computed(() => conversation.value?.title ?? 'New task')
const status = computed(() => conversation.value?.status ?? 'idle')
const worktree = computed(() => conversation.value?.worktree)
const summary = computed(() => conversation.value?.summary)
const changedFiles = computed(() => conversation.value?.changedFiles)
const changedEntities = computed(() => conversation.value?.changedEntities)
const previewUrl = computed(() =>
  worktree.value ? `localhost:${worktree.value.port}` : undefined
)

const isExpanded = ref(false)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    isExpanded.value = !isExpanded.value
  }
}

const isStampVisible = computed(() =>
  status.value === 'approved' || status.value === 'merged'
)

const stampLabel = computed(() =>
  status.value === 'merged' ? 'MERGED' : '✓'
)
</script>

<template>
  <div
    class="task-brief"
    :class="[`status-${status}`, { 'is-expanded': isExpanded }]"
    role="button"
    tabindex="0"
    :aria-expanded="isExpanded"
    aria-label="Task brief — click to expand"
    @click="isExpanded = !isExpanded"
    @keydown="handleKeydown"
  >
    <!-- Paper dog-ear (top-inline-end corner fold) -->
    <div class="brief-dog-ear" aria-hidden="true" />

    <!-- Header band -->
    <TaskBriefHeader :status="status" :branch="worktree?.branch" />

    <!-- Card body -->
    <div class="brief-body p-s">
      <!-- Title row: title + compact actions (visible when collapsed) -->
      <div class="brief-title-row hstack gap-xxs">
        <Text
          tag="h2"
          variant="body"
          weight="semibold"
          class="brief-title flex-1 min-w-0"
          :title="title"
        >{{ title }}</Text>

        <TaskBriefActions
          v-if="!isExpanded"
          compact
          :preview-url="previewUrl"
          :status="status"
          @preview="emit('preview', conversationId)"
          @review="emit('review', conversationId)"
        />
      </div>

      <!-- Summary -->
      <Text
        v-if="summary"
        variant="body-small"
        color="muted"
        class="brief-summary"
        :class="{ 'is-truncated': !isExpanded }"
      >{{ summary }}</Text>

      <!-- Stats -->
      <TaskBriefStats
        class="brief-stats"
        :changed-files="changedFiles"
        :changed-entities="changedEntities"
        :compact="!isExpanded"
      />

      <!-- Expandable section: full stats + footer actions -->
      <div class="brief-expand-wrap">
        <div class="brief-expand-inner">
          <div class="brief-rule" aria-hidden="true" />
          <TaskBriefActions
            :preview-url="previewUrl"
            :status="status"
            @preview="emit('preview', conversationId)"
            @review="emit('review', conversationId)"
          />
        </div>
      </div>
    </div>

    <!-- Approved / Merged stamp (decorative) -->
    <div v-if="isStampVisible" class="brief-stamp" aria-hidden="true">
      {{ stampLabel }}
    </div>

    <!-- Review watermark (decorative) -->
    <div v-if="status === 'review'" class="brief-watermark" aria-hidden="true">REVIEW</div>
  </div>
</template>

<style scoped>
/* ── Card container ── */

.task-brief {
  position: relative;
  background: var(--color-paper);
  border: 1px solid var(--color-paper-rule);
  border-radius: var(--radius-m);
  box-shadow:
    0 1px 2px var(--color-paper-shadow),
    0 4px 12px var(--color-paper-shadow);
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    filter var(--duration-moderate) var(--ease-out),
    box-shadow var(--duration-moderate) var(--ease-out);
}

/* Desaturate done/rejected states */
.task-brief.status-merged,
.task-brief.status-rejected {
  filter: saturate(0.6);
}

.task-brief:focus-visible {
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 2px; /* Intentional: optical separation from card border */
}

/* ── Dog-ear fold (top-inline-end corner) ── */

.brief-dog-ear {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  /* --space-s = 12px: closest grid value to desired ~10px fold */
  width: var(--space-s);
  height: var(--space-s);
  /* Two-triangle gradient: shows the darker paper underside */
  background: linear-gradient(
    225deg,
    var(--color-paper-dog-ear) 50%,
    transparent 50%
  );
  z-index: 1;
  pointer-events: none;
}

/* ── Card body ── */

.brief-body {
  position: relative;
}

/* ── Title ── */

.brief-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Summary ── */

.brief-summary {
  margin-block-start: var(--space-xxxs);
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.brief-summary.is-truncated {
  -webkit-line-clamp: 1;
  overflow: hidden;
}

/* ── Stats ── */

.brief-stats {
  margin-block-start: var(--space-xxxs);
}

/* ── Expand/collapse via grid-template-rows ── */

.brief-expand-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-moderate) var(--ease-out);
}

.is-expanded .brief-expand-wrap {
  grid-template-rows: 1fr;
}

.brief-expand-inner {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

/* ── Form-line divider ── */

.brief-rule {
  block-size: 1px;
  background: var(--color-paper-rule);
  margin-block-start: var(--space-xs);
}

/* ── Approved / Merged stamp ── */

.brief-stamp {
  position: absolute;
  inset-block-end: var(--space-s);
  inset-inline-end: var(--space-s);
  /* --space-xxl = 32px: intentional exception, sized for a readable stamp not as spacing */
  width: var(--space-xxl);
  height: var(--space-xxl);
  border-radius: 50%;
  border: 2px solid var(--color-brief-stamp);
  color: var(--color-brief-stamp);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  opacity: 0.35;
  transform: rotate(-12deg);
  pointer-events: none;
  transition: opacity var(--duration-moderate) var(--ease-out);
}

/* ── Review watermark ── */

.brief-watermark {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%) rotate(-20deg);
  font-size: 48px; /* Intentional exception: decorative watermark, no typography token at this size */
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.1em;
  color: var(--color-brief-watermark);
  opacity: 0.05;
  pointer-events: none;
  white-space: nowrap;
  user-select: none;
}
</style>
```

- [ ] **Step 2: Verify the dev server shows no errors**

Run `npm run dev`, open `http://localhost:3025`. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/composites/task-brief/TaskBrief.vue
git commit -m "feat: add TaskBrief root card component"
```

---

### Task 8: Wire into SitePage

**Files:**
- Modify: `src/pages/SitePage.vue`

- [ ] **Step 1: Replace the `TaskToolbar` import with `TaskBrief`**

Find line 11:
```typescript
import TaskToolbar from '@/components/composites/TaskToolbar.vue'
```

Replace with:
```typescript
import TaskBrief from '@/components/composites/task-brief/TaskBrief.vue'
```

- [ ] **Step 2: Replace the `<TaskToolbar>` usage in the template**

Find (around line 209):
```html
<TaskToolbar v-if="!isNewTask" :conversation-id="selectedConvoId" />
```

Replace with:
```html
<TaskBrief
  v-if="!isNewTask"
  :conversation-id="selectedConvoId"
  class="task-brief-panel"
  @preview="(id) => { /* TODO: open preview */ }"
  @review="(id) => { /* out of scope: review view not yet built */ }"
/>
```

- [ ] **Step 3: Add scoped CSS for the card's position in the panel**

In the `<style scoped>` block, after `.pane-detail`, add:

```css
.task-brief-panel {
  flex-shrink: 0;
  margin: var(--space-s);
  margin-block-end: 0;
}
```

- [ ] **Step 4: Verify in the browser**

Open `http://localhost:3025`. Navigate to a site and select each of these conversations:
- `blog-assistant-1` — should show blue header, "REVIEW" watermark
- `blog-code-1` — should show green header, "MERGED" stamp, desaturated
- `cafe-photos` — should show green header, "✓" stamp
- Any idle task — should show grey header, no special treatment

Click a card to expand/collapse. Tab to the card and press Enter — should also toggle.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SitePage.vue
git commit -m "feat: wire TaskBrief into SitePage, replacing TaskToolbar"
```

---

## Chunk 4: Cleanup

### Task 9: Remove TaskToolbar

**Files:**
- Delete: `src/components/composites/TaskToolbar.vue`

- [ ] **Step 1: Confirm TaskToolbar is no longer imported anywhere**

```bash
grep -r "TaskToolbar" src/
```

Expected: no output.

- [ ] **Step 2: Delete the file and commit**

```bash
git rm src/components/composites/TaskToolbar.vue
git commit -m "chore: remove TaskToolbar, replaced by TaskBrief"
```

- [ ] **Step 3: Verify the dev server still runs cleanly**

Navigate to a task. Card should appear, no console errors.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/styles/colors.css` | Modify | Add `--color-paper-*`, `--color-brief-*` variables (light + both dark mode blocks) |
| `src/data/types.ts` | Modify | Add `ChangedFile`, `ChangedEntity` interfaces; extend `Conversation` |
| `src/data/seed-conversations.ts` | Modify | Add `summary`, `changedFiles`, `changedEntities` to sample conversations |
| `src/components/composites/task-brief/TaskBriefHeader.vue` | Create | Status band: status dot + label, branch name |
| `src/components/composites/task-brief/TaskBriefStats.vue` | Create | Files & entities, compact and two-column expanded modes |
| `src/components/composites/task-brief/TaskBriefActions.vue` | Create | Preview + Review buttons, compact and full modes |
| `src/components/composites/task-brief/TaskBrief.vue` | Create | Root card: paper treatment, collapse/expand, status visuals |
| `src/pages/SitePage.vue` | Modify | Swap `TaskToolbar` for `TaskBrief` |
| `src/components/composites/TaskToolbar.vue` | Delete | Replaced by TaskBrief |
