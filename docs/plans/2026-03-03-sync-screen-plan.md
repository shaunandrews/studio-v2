# Sync Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Sync stub screen with a deployment pipeline UI — vertical stage flow, selective sync panel, educational empty state.

**Architecture:** Data types added to `types.ts`, seed data enriched, new `usePipeline.ts` composable for CRUD + simulated sync. `SyncScreen.vue` orchestrates empty state vs pipeline view. Pipeline is a vertical stack of `StageCard` components connected by `PipelineConnector` action buttons. Sync dialog is a slide-over `SyncPanel` that overlays the pipeline.

**Tech Stack:** Vue 3 Composition API, TypeScript, scoped CSS with design tokens, `@wordpress/icons`

---

### Task 1: Add Pipeline Types to Data Model

**Files:**
- Modify: `src/data/types.ts` (after line 22, after Project interface)

**Step 1: Add the new types**

Add these types after the `Project` interface (around line 22):

```typescript
export type EnvironmentType = 'staging' | 'qa' | 'review' | 'production' | 'custom'

export interface ConnectedSite {
  id: string
  name: string
  url: string
  provider: 'wpcom' | 'pressable'
  lastPullAt?: string
  lastPushAt?: string
}

export interface PipelineStage {
  id: string
  label: string
  environment: EnvironmentType
  site?: ConnectedSite
  order: number
}
```

And add `pipeline?: PipelineStage[]` to the `Project` interface.

**Step 2: Verify dev server still compiles**

Run: check browser console at http://localhost:3025 — no type errors.

**Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(sync): add pipeline and connected site types"
```

---

### Task 2: Add Pipeline Seed Data

**Files:**
- Modify: `src/data/seed-projects.ts`

**Step 1: Add pipeline to Downstreet Cafe**

Import `PipelineStage` from types. Add a `pipeline` array to the Downstreet Cafe project with two stages:

```typescript
pipeline: [
  {
    id: 'stage-staging',
    label: 'Staging',
    environment: 'staging',
    order: 1,
    site: {
      id: 'ds-staging',
      name: 'Downstreet Café Staging',
      url: 'https://staging.downstreet.cafe',
      provider: 'pressable',
      lastPushAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'stage-production',
    label: 'Production',
    environment: 'production',
    order: 2,
    site: {
      id: 'ds-production',
      name: 'Downstreet Café',
      url: 'https://downstreet.cafe',
      provider: 'wpcom',
      lastPushAt: '2026-02-28T16:00:00Z',
      lastPullAt: '2026-02-25T10:30:00Z',
    },
  },
],
```

Studio Meridian gets no pipeline (empty state demo).

**Step 2: Verify seed data loads**

Check browser — project page still renders, no errors.

**Step 3: Commit**

```bash
git add src/data/seed-projects.ts
git commit -m "feat(sync): add pipeline seed data to Downstreet Cafe"
```

---

### Task 3: Create usePipeline Composable

**Files:**
- Create: `src/data/usePipeline.ts`

**Step 1: Write the composable**

Singleton composable that reads/writes pipeline data on the project. Key methods:

```typescript
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useProjects } from './useProjects'
import type { PipelineStage, EnvironmentType } from './types'

// Sync panel state
const syncPanelOpen = ref(false)
const syncAction = ref<{ verb: 'push' | 'pull' | 'promote'; fromStage: string; toStage: string } | null>(null)
const syncProgress = ref<{ phase: 'idle' | 'syncing' | 'done' | 'error'; percent: number; label: string }>({
  phase: 'idle', percent: 0, label: '',
})

export function usePipeline(projectId: Ref<string | null>) {
  const { projects } = useProjects()

  const project = computed(() =>
    projects.value.find(p => p.id === projectId.value) ?? null
  )

  const pipeline = computed(() => project.value?.pipeline ?? [])

  const hasPipeline = computed(() => pipeline.value.length > 0)

  function setupDefaultPipeline() {
    if (!project.value) return
    project.value.pipeline = [
      { id: `stage-${Date.now()}-1`, label: 'Staging', environment: 'staging', order: 1 },
      { id: `stage-${Date.now()}-2`, label: 'Production', environment: 'production', order: 2 },
    ]
  }

  function addStage(environment: EnvironmentType, label: string) {
    if (!project.value) return
    if (!project.value.pipeline) project.value.pipeline = []
    const order = project.value.pipeline.length + 1
    project.value.pipeline.push({
      id: `stage-${Date.now()}`,
      label,
      environment,
      order,
    })
  }

  function removeStage(stageId: string) {
    if (!project.value?.pipeline) return
    project.value.pipeline = project.value.pipeline.filter(s => s.id !== stageId)
    // Reorder
    project.value.pipeline.forEach((s, i) => { s.order = i + 1 })
  }

  function disconnectSite(stageId: string) {
    const stage = project.value?.pipeline?.find(s => s.id === stageId)
    if (stage) stage.site = undefined
  }

  function openSyncPanel(verb: 'push' | 'pull' | 'promote', fromStage: string, toStage: string) {
    syncAction.value = { verb, fromStage, toStage }
    syncProgress.value = { phase: 'idle', percent: 0, label: '' }
    syncPanelOpen.value = true
  }

  function closeSyncPanel() {
    syncPanelOpen.value = false
    syncAction.value = null
    syncProgress.value = { phase: 'idle', percent: 0, label: '' }
  }

  // Simulated sync — ticks progress over ~3 seconds
  function startSync() {
    const categories = ['Plugins', 'Themes', 'Uploads', 'Database']
    let step = 0
    syncProgress.value = { phase: 'syncing', percent: 0, label: `Syncing ${categories[0]}...` }

    const interval = setInterval(() => {
      step++
      const percent = Math.min(Math.round((step / (categories.length * 3)) * 100), 100)
      const catIndex = Math.min(Math.floor(step / 3), categories.length - 1)
      syncProgress.value = {
        phase: 'syncing',
        percent,
        label: `Syncing ${categories[catIndex]}...`,
      }
      if (percent >= 100) {
        clearInterval(interval)
        syncProgress.value = { phase: 'done', percent: 100, label: 'Synced successfully' }
        // Update last push/pull timestamp on the target stage
        if (syncAction.value) {
          const stage = project.value?.pipeline?.find(s => s.id === syncAction.value!.toStage)
          if (stage?.site) {
            if (syncAction.value.verb === 'pull') {
              stage.site.lastPullAt = new Date().toISOString()
            } else {
              stage.site.lastPushAt = new Date().toISOString()
            }
          }
        }
      }
    }, 250)
  }

  return {
    pipeline,
    hasPipeline,
    syncPanelOpen,
    syncAction,
    syncProgress,
    setupDefaultPipeline,
    addStage,
    removeStage,
    disconnectSite,
    openSyncPanel,
    closeSyncPanel,
    startSync,
  }
}
```

**Step 2: Verify no import errors**

Check browser console.

**Step 3: Commit**

```bash
git add src/data/usePipeline.ts
git commit -m "feat(sync): add usePipeline composable with simulated sync"
```

---

### Task 4: Build SyncEmptyState Component

**Files:**
- Create: `src/components/features/sync/SyncEmptyState.vue`

**Step 1: Create the component**

Props: none. Emits: `setup` (user clicks the CTA).

Layout: centered flex column. Heading, subtext, three-box diagram (pure CSS — three inline-flex boxes with arrows between them), primary Button CTA.

The diagram boxes use `border: 1px solid var(--color-surface-border)`, `border-radius: var(--radius-s)`, `padding: var(--space-xs) var(--space-s)`, `font-size: var(--font-size-xs)`, `color: var(--color-text-muted)`. Arrows are `→` characters or short horizontal lines between boxes, same muted color.

Button imports from `@/components/primitives/Button.vue`, variant `primary`, label "Set up your pipeline".

**Step 2: Verify it renders**

Temporarily render it in SyncScreen to check layout.

**Step 3: Commit**

```bash
git add src/components/features/sync/SyncEmptyState.vue
git commit -m "feat(sync): add empty state with pipeline diagram"
```

---

### Task 5: Build StageCard Component

**Files:**
- Create: `src/components/features/sync/StageCard.vue`

**Step 1: Create the component**

Props:
```typescript
{
  variant: 'local' | 'connected' | 'unconnected'
  label: string
  environment: EnvironmentType
  url?: string
  provider?: string
  status?: ProjectStatus          // for local variant
  lastSyncLabel?: string          // e.g. "Synced 2h ago", "Last: Feb 28"
  connectedStages?: string[]      // for local's "Pull from" dropdown
}
```

Emits: `connect`, `disconnect`, `pull` (with stage label)

Three variants controlled by `variant` prop:

**Local:** Environment dot (uses `--color-status-running/stopped/loading` matching project status) + "Local" label + status text. URL line shows `localhost:3920`. Third row has "Pull from ▾" dropdown (a `<select>` or custom dropdown listing `connectedStages`). Only shows Pull from if `connectedStages` has items.

**Connected:** Environment dot (colored by environment type) + stage label + lastSyncLabel. URL as external link (`target="_blank"`). Provider name small/muted. "Disconnect" text button on the right, `color-text-muted`, hover `color-text`.

**Unconnected:** Dashed border via `border-style: dashed`. Muted dot + label + "Not connected". Secondary Button "Connect site" centered.

Environment dot colors — a small computed or CSS class map:
- production → `--color-status-running` (green)
- staging → `--color-status-warning` (amber)
- qa, review → `--color-primary` (blue)
- custom → `--color-text-muted` (gray)

Card base styles: `border: 1px solid var(--color-surface-border)`, `border-radius: var(--radius-m)`, `padding: var(--space-s) var(--space-m)`, `background: var(--color-surface)`.

**Step 2: Visually test all three variants**

Temporarily render all three in SyncScreen to verify styling.

**Step 3: Commit**

```bash
git add src/components/features/sync/StageCard.vue
git commit -m "feat(sync): add StageCard with local/connected/unconnected variants"
```

---

### Task 6: Build PipelineConnector Component

**Files:**
- Create: `src/components/features/sync/PipelineConnector.vue`

**Step 1: Create the component**

Props:
```typescript
{
  label: string     // e.g. "Push to Staging", "Promote to Production"
  disabled?: boolean  // true when target stage is unconnected
}
```

Emits: `action`

Layout: A vertical connector with a button in the middle.

```
   │              ← 1px line, 20px tall, color-surface-border, centered
   [ Push to Staging ▼ ]   ← tertiary button, centered
   │              ← 1px line, 20px tall
```

The lines are `::before` and `::after` pseudo-elements on the container, or simple divs. The button is a `<button>` styled as tertiary (no background, muted text, hover gets surface-secondary bg). The `▼` is a small chevron-down icon or just the unicode character.

When `disabled`, the button is grayed out and not clickable.

**Step 2: Commit**

```bash
git add src/components/features/sync/PipelineConnector.vue
git commit -m "feat(sync): add pipeline connector with action button"
```

---

### Task 7: Build AddStageButton Component

**Files:**
- Create: `src/components/features/sync/AddStageButton.vue`

**Step 1: Create the component**

Emits: `add` with `{ environment: EnvironmentType, label: string }`

Layout: A small `+` circle (24px, border, rounded-full, centered) with "Add stage" text next to or below it. Clicking opens an inline picker — a small card/popover with environment type options as a list of buttons: Staging, QA, Review, Production, Custom. Clicking one emits `add` with the selected type and closes the picker.

Use a `ref<boolean>` for picker visibility. The picker is absolutely positioned below the button.

Environment options list:
```typescript
const options: { environment: EnvironmentType; label: string }[] = [
  { environment: 'staging', label: 'Staging' },
  { environment: 'qa', label: 'QA' },
  { environment: 'review', label: 'Review' },
  { environment: 'production', label: 'Production' },
  { environment: 'custom', label: 'Custom' },
]
```

**Step 2: Commit**

```bash
git add src/components/features/sync/AddStageButton.vue
git commit -m "feat(sync): add stage button with environment picker"
```

---

### Task 8: Build SyncPipeline Component

**Files:**
- Create: `src/components/features/sync/SyncPipeline.vue`

**Step 1: Create the component**

Props:
```typescript
{
  projectId: string
  projectStatus: ProjectStatus
  projectUrl: string
}
```

Emits: `sync` (when a push/promote/pull action is triggered)

This is the orchestrator that composes StageCard + PipelineConnector + AddStageButton into the vertical pipeline.

```typescript
import { toRef } from 'vue'
import { usePipeline } from '@/data/usePipeline'
import StageCard from './StageCard.vue'
import PipelineConnector from './PipelineConnector.vue'
import AddStageButton from './AddStageButton.vue'

const props = defineProps<{ ... }>()
const { pipeline, addStage, removeStage, disconnectSite, openSyncPanel } = usePipeline(toRef(props, 'projectId'))
```

Template structure:
1. **Local StageCard** (always first) — variant `local`, gets project status/url, connectedStages = names of stages that have a site connected
2. **For each stage in pipeline:** PipelineConnector (verb depends on position: "Push to X" if from local, "Promote to X" otherwise) + StageCard (connected or unconnected based on whether `stage.site` exists)
3. **AddStageButton** at the bottom

Helper functions:
- `getConnectorLabel(index)` — "Push to [label]" if index 0 (from local), "Promote to [label]" otherwise
- `getLastSyncLabel(stage)` — formats lastPushAt/lastPullAt into relative time ("Synced 2h ago", "Last: Feb 28")
- `connectedStageNames` — computed list of stage labels where site is defined (for local's Pull from dropdown)

Max-width container: `max-width: 600px; margin: 0 auto; padding: var(--space-l);`

**Step 2: Verify pipeline renders with seed data**

Wire into SyncScreen temporarily, check Downstreet Cafe shows Local → Staging → Production.

**Step 3: Commit**

```bash
git add src/components/features/sync/SyncPipeline.vue
git commit -m "feat(sync): add pipeline layout composing stage cards and connectors"
```

---

### Task 9: Build SyncPanel (Slide-over)

**Files:**
- Create: `src/components/features/sync/SyncPanel.vue`

**Step 1: Create the component**

Props:
```typescript
{
  open: boolean
  actionLabel: string   // "Push to Staging", "Pull from Production", etc.
  verb: 'push' | 'pull' | 'promote'
  progress: { phase: 'idle' | 'syncing' | 'done' | 'error'; percent: number; label: string }
}
```

Emits: `close`, `start`

Layout: Fixed position panel on the right side of the parent (not the viewport — use `position: absolute` within the sync screen's relative container).

**Idle state** (phase = 'idle'):
- Header: action label + close (X) button
- Checklist: 5 categories, each a row with checkbox + label + file count
  ```typescript
  const categories = ref([
    { id: 'plugins', label: 'Plugins', count: 12, checked: true },
    { id: 'themes', label: 'Themes', count: 3, checked: true },
    { id: 'uploads', label: 'Uploads', count: 148, checked: true },
    { id: 'database', label: 'Database', count: null, checked: true },
    { id: 'wpconfig', label: 'wp-config.php', count: null, checked: false },
  ])
  ```
- Summary: computed from checked categories — "163 files, 1 DB" or similar
- Action button: primary, full width, label matches verb ("Push" / "Pull")

**Syncing state** (phase = 'syncing'):
- Header stays
- Checklist replaced by progress bar (simple `<div>` with width percentage) + status label
- Action button disabled

**Done state** (phase = 'done'):
- Green checkmark + "Synced successfully" + relative timestamp
- "Close" button

Panel CSS:
- `position: absolute; inset-block: 0; inset-inline-end: 0; width: 400px;`
- `background: var(--color-surface); border-inline-start: 1px solid var(--color-surface-border);`
- `box-shadow: -4px 0 12px var(--color-shadow);`
- Transition: `transform 200ms var(--ease-default)` — slides from `translateX(100%)` to `translateX(0)`
- Backdrop: sibling div covering the rest of the parent with `background: rgba(0,0,0,0.05)`

Close on: X button, backdrop click, Escape key (use `@keydown.escape` on the panel with `tabindex="-1"` + auto-focus).

**Step 2: Commit**

```bash
git add src/components/features/sync/SyncPanel.vue
git commit -m "feat(sync): add slide-over sync panel with checklist and progress"
```

---

### Task 10: Wire Everything into SyncScreen

**Files:**
- Modify: `src/components/features/SyncScreen.vue`

**Step 1: Rewrite SyncScreen**

Replace the stub with the orchestrator:

```typescript
import { toRef } from 'vue'
import { useProjects } from '@/data/useProjects'
import { usePipeline } from '@/data/usePipeline'
import SyncEmptyState from './sync/SyncEmptyState.vue'
import SyncPipeline from './sync/SyncPipeline.vue'
import SyncPanel from './sync/SyncPanel.vue'

const props = defineProps<{ projectId: string }>()
const projectIdRef = toRef(props, 'projectId')
const { projects } = useProjects()
const { hasPipeline, syncPanelOpen, syncAction, syncProgress, setupDefaultPipeline, closeSyncPanel, startSync } = usePipeline(projectIdRef)

const project = computed(() => projects.value.find(p => p.id === props.projectId))
```

Template:
```html
<div class="sync-screen">
  <SyncEmptyState v-if="!hasPipeline" @setup="setupDefaultPipeline" />
  <template v-else>
    <SyncPipeline
      :project-id="projectId"
      :project-status="project?.status ?? 'stopped'"
      :project-url="project?.url ?? 'localhost'"
    />
    <SyncPanel
      :open="syncPanelOpen"
      :action-label="syncActionLabel"
      :verb="syncAction?.verb ?? 'push'"
      :progress="syncProgress"
      @close="closeSyncPanel"
      @start="startSync"
    />
  </template>
</div>
```

The `.sync-screen` needs `position: relative; overflow: hidden;` to contain the slide-over panel.

Compute `syncActionLabel` from `syncAction` — map the verb + target stage label.

**Step 2: Test both states**

- Switch to Studio Meridian → see empty state
- Click "Set up your pipeline" → see pipeline with 2 unconnected stages
- Switch to Downstreet Cafe → see connected pipeline
- Click "Push to Staging" → sync panel slides in
- Click "Push" → progress bar runs → "Synced successfully"
- Close panel → back to pipeline

**Step 3: Commit**

```bash
git add src/components/features/SyncScreen.vue
git commit -m "feat(sync): wire SyncScreen with pipeline, empty state, and sync panel"
```

---

### Task 11: Polish and Final Touches

**Files:**
- Possibly touch: any of the above for spacing/color/interaction refinements

**Step 1: Visual review**

Walk through both projects (Downstreet Cafe with pipeline, Studio Meridian empty state). Check:
- Card spacing is consistent with 5px grid
- Environment dot colors are correct
- Timestamps format nicely
- Dark mode (prefers-color-scheme) doesn't break anything
- Slide-over panel animation is smooth
- Progress bar fills naturally

**Step 2: Fix any issues found**

Surgical edits only.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(sync): polish pipeline UI and fix visual issues"
```
