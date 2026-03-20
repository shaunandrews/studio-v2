# Site-First Data Model + Full IndexedDB Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the data layer so Site is the primary entity, everything hangs off it, and all domain data persists in IndexedDB across refresh.

**Architecture:** Single Dexie database with 4 tables (sites, tasks, messages, previews). All composables use write-through: mutate ref, then persist. Hydration reads from DB on return visits, seeds from persona on first visit. Agents/skills stay in localStorage (static catalog, not per-site domain data). Auth/onboarding restored from persona (not user-modifiable state). Transient UI state (modals, wizards, canvas pan/zoom) intentionally stays in-memory.

**Tech Stack:** Vue 3 + Dexie (IndexedDB) + TypeScript. Already installed.

---

## Current State

### What already persists in IndexedDB
- `sites` table — Site objects (includes embedded `pipeline` stages)
- `tasks` table — Task objects (includes embedded `worktree`, `changedFiles`, `changedEntities`)
- `messages` table — Message objects (linked to tasks via `taskId`)

### What's missing
- **Previews** — `usePreviews` is in-memory only, seed data re-loaded every refresh
- **Persona** — `Persona` type bundles sites/tasks/messages but not previews; needs previews added so persona switching resets all domain data consistently

### What's already fine
- **Agents/skills** — localStorage. These are a static catalog with install toggles, not per-site domain data. No change needed.
- **Auth/onboarding** — Restored from persona on hydrate. Not user-modifiable (no "edit profile" UI). No change needed.
- **UI prefs** — Sidebar collapse, OS mode, all-sites toggle, pane widths. All localStorage. No change needed.
- **Transient UI** — Settings modal, add-site wizard, site transitions, import/export progress, canvas state. All correctly in-memory. No change needed.

### Pipeline/sync state
Pipeline stages are already embedded in `Site.pipeline` and persisted to IndexedDB. The `usePipeline` composable manages transient UI (setupPhase, modals, sync progress simulation) around that persisted data. **No structural change needed** — the pipeline data already survives refresh. The `setupPhase` (which pipeline setup step you're on) is transient wizard state that correctly resets on refresh.

### Site map / page structure
The site map is derived at render time from `site.mockLayout` via `useSiteTemplates.deriveSiteMapTree()`. It's not stored data — it's computed from the site's template configuration. **No change needed.**

### Settings
`SiteSettingsScreen` reads from `site.themeType`, `site.features`, `site.skillOverrides` — all fields on the Site object, which is already persisted. The settings modal state (`useSettings`) is correctly transient. **No change needed.**

---

## What Actually Needs to Change

This is a focused change with a small blast radius:

### 1. Add `previews` table to Dexie

New IndexedDB table alongside the existing 3. The `PreviewSite` type is already defined in `types.ts` — no type changes needed.

### 2. Add write-through to `usePreviews`

Same pattern as `useTasks`: mutate ref, then persist. Uses `toRaw()` + JSON serialize before writing.

### 3. Add preview seed data to Persona

The existing `seedPreviews` array in `usePreviews.ts` moves to a `seed-previews.ts` file and gets included in the Persona type + persona definitions, so persona switching resets previews like it resets everything else.

### 4. Add previews to hydration + persona reset

`useHydration.hydrate()` loads previews from DB. `usePersona.activatePersona()` clears + re-seeds the previews table.

### 5. Update DATA-SYSTEM.md

Document the final state of what persists where.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/data/db.ts` | Modify | Add `previews` table, bump version to 2 |
| `src/data/seed-previews.ts` | Create | Extract seed previews from usePreviews |
| `src/data/usePreviews.ts` | Modify | Add write-through persistence to all mutations |
| `src/data/types.ts` | Modify | Add `previews` field to `Persona` interface |
| `src/data/personas.ts` | Modify | Include `seedPreviews` in existing-user persona |
| `src/data/useHydration.ts` | Modify | Load previews from DB, seed on first visit |
| `src/data/usePersona.ts` | Modify | Clear + re-seed previews table on persona switch |
| `DATA-SYSTEM.md` | Modify | Update persistence coverage section |

---

## Tasks

### Task 1: Add previews table to Dexie

**Files:**
- Modify: `src/data/db.ts`

- [ ] **Step 1: Bump DB version and add previews table**

In `db.ts`, change `this.version(1)` to add a v2 upgrade with the previews table:

```typescript
import type { Site, Task, Message, PreviewSite } from './types'

class StudioDatabase extends Dexie {
  sites!: Table<Site, string>
  tasks!: Table<Task, string>
  messages!: Table<Message, string>
  previews!: Table<PreviewSite, string>

  constructor() {
    super('studio-v2')
    this.version(1).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
    })
    this.version(2).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
    })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: Clean (no output)

- [ ] **Step 3: Commit**

```bash
git add src/data/db.ts
git commit -m "feat(db): add previews table to Dexie schema v2"
```

---

### Task 2: Extract seed previews

**Files:**
- Create: `src/data/seed-previews.ts`

- [ ] **Step 1: Create seed file**

Extract the `seedPreviews` array from `usePreviews.ts` into its own file. Keep the helper functions (`daysAgo`) that the seed data uses:

```typescript
import type { PreviewSite } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const seedPreviews: PreviewSite[] = [
  // ... exact same 4 preview objects currently in usePreviews.ts
]
```

- [ ] **Step 2: Update usePreviews to import from seed file**

Replace the inline `seedPreviews` array and `daysAgo` helper in `usePreviews.ts` with:

```typescript
import { seedPreviews } from './seed-previews'
```

Remove the `daysAgo` function and the `seedPreviews` const from `usePreviews.ts`.

- [ ] **Step 3: Verify TypeScript compiles and app loads**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/data/seed-previews.ts src/data/usePreviews.ts
git commit -m "refactor(previews): extract seed data to seed-previews.ts"
```

---

### Task 3: Add Persona.previews + update persona definitions

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/personas.ts`

- [ ] **Step 1: Add previews to Persona interface**

In `types.ts`, add `previews` field to the `Persona` interface:

```typescript
export interface Persona {
  id: string
  name: string
  description: string
  icon: string
  auth: AuthUser | null
  onboardingCompleted: boolean
  sites: Site[]
  tasks: Task[]
  messages: Message[]
  previews: PreviewSite[]  // <-- add this
}
```

- [ ] **Step 2: Update persona definitions**

In `personas.ts`, import `seedPreviews` and add to both personas:

```typescript
import { seedPreviews } from './seed-previews'

// new-user persona:
previews: [],

// existing-user persona:
previews: seedPreviews,
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/data/types.ts src/data/personas.ts
git commit -m "feat(persona): add previews to Persona type and seed data"
```

---

### Task 4: Add write-through persistence to usePreviews

**Files:**
- Modify: `src/data/usePreviews.ts`

- [ ] **Step 1: Add persist helper and imports**

At the top of `usePreviews.ts`, add:

```typescript
import { toRaw } from 'vue'
import { db, isDbAvailable } from './db'
```

Add persist helper (same pattern as useTasks):

```typescript
async function persistPreview(preview: PreviewSite) {
  if (await isDbAvailable()) {
    const raw = JSON.parse(JSON.stringify(toRaw(preview)))
    await db.previews.put(raw)
  }
}

async function deletePreviewFromDb(previewId: string) {
  if (await isDbAvailable()) {
    await db.previews.delete(previewId)
  }
}
```

- [ ] **Step 2: Add persist calls to every mutation**

Add `persistPreview()` calls after every ref mutation in these functions:
- `createPreview` — do NOT persist during `previews.value.unshift(preview)` (status is `'creating'`, transient). Only persist in the `simulateProgress` `onComplete` callback after setting `status: 'active'`. This avoids orphaned creating-state records if user refreshes mid-operation.
- `updatePreview` — persist in the `onComplete` callback after setting `updatedAt`
- `deletePreview` — call `deletePreviewFromDb(previewId)` in the `onComplete` callback (removes the record entirely, don't just mark deleted)
- `renamePreview` — persist after `preview.name = name`
- `extendPreview` — persist after `preview.updatedAt = ...`
- `clearPreview` — call `deletePreviewFromDb(previewId)` after `splice`
- `updateNote` — persist after `preview.note = note`
- `addInvite` — persist after `preview.invites.push(...)`
- `removeInvite` — persist after `splice`

- [ ] **Step 3: Add reset + hydration setter**

Add these functions to the composable:

```typescript
async function resetPreviews(newPreviews: PreviewSite[]) {
  if (await isDbAvailable()) {
    await db.previews.clear()
    if (newPreviews.length) await db.previews.bulkPut(newPreviews)
  }
  previews.value = newPreviews.map(p => ({ ...p }))
  operations.value = []
}

function _setPreviews(newPreviews: PreviewSite[]) {
  previews.value = newPreviews
  operations.value = []
}
```

Include `resetPreviews` and `_setPreviews` in the return object.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/data/usePreviews.ts
git commit -m "feat(previews): add IndexedDB write-through persistence"
```

---

### Task 5: Wire previews into hydration + persona reset

**Files:**
- Modify: `src/data/useHydration.ts`
- Modify: `src/data/usePersona.ts`

- [ ] **Step 1: Update useHydration to load previews**

In `useHydration.ts`:

Import `usePreviews`:
```typescript
import { usePreviews } from './usePreviews'
```

In the `dbOk` branch, add previews to the parallel DB read:
```typescript
const [dbSites, dbTasks, dbMessages, dbPreviews] = await Promise.all([
  db.sites.toArray(),
  db.tasks.toArray(),
  db.messages.toArray(),
  db.previews.toArray(),
])
```

After `_setTasks`, add:
```typescript
const { _setPreviews } = usePreviews()
_setPreviews(dbPreviews)
```

In the seed-on-first-load branch, add previews:
```typescript
if (persona.previews.length) await db.previews.bulkPut(persona.previews)
```

In the `!dbOk` fallback branch, add:
```typescript
const { _setPreviews } = usePreviews()
_setPreviews(persona.previews.map(p => ({ ...p })))
```

- [ ] **Step 2: Update usePersona to clear + re-seed previews**

In `usePersona.ts`:

Import `usePreviews`:
```typescript
import { usePreviews } from './usePreviews'
```

In `activatePersona`, add `resetPreviews` alongside the other resets:
```typescript
const { resetPreviews } = usePreviews()
```

In the DB transaction (alongside the existing clear+seed), add:
```typescript
await db.previews.clear()
if (persona.previews.length) await db.previews.bulkPut(persona.previews)
```

After the existing `await resetTasks(...)`, add:
```typescript
await resetPreviews(persona.previews)
```

In `clearPersona`, add `db.previews` to the transaction:
```typescript
await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, async () => {
  await db.sites.clear()
  await db.tasks.clear()
  await db.messages.clear()
  await db.previews.clear()
})
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/data/useHydration.ts src/data/usePersona.ts
git commit -m "feat(hydration): wire previews into hydration and persona reset"
```

---

### Task 6: Update documentation

**Files:**
- Modify: `DATA-SYSTEM.md`

- [ ] **Step 1: Update persistence coverage**

In `DATA-SYSTEM.md`:

First, update the opening description — change "task-first data model" language to "site-first" framing to match the new mental model.

Then update the "Current persistence coverage" section:

Under "Persisted in IndexedDB", add:
```
- **Previews** — `usePreviews.ts` → `db.previews`
```

Remove "Previews" from the "Not yet persisted" section.

Update the database section to show all 4 tables:
```
sites:    'id'
tasks:    'id, siteId, status, updatedAt, [siteId+archived]'
messages: 'id, taskId, timestamp'
previews: 'id, siteId, status'
```

- [ ] **Step 2: Commit**

```bash
git add DATA-SYSTEM.md
git commit -m "docs: update DATA-SYSTEM.md with previews persistence"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Clear browser data** — Delete IndexedDB `studio-v2` database and localStorage
- [ ] **Step 2: Load app** — Select "existing user" persona
- [ ] **Step 3: Check previews** — Navigate to Downstreet Cafe → Previews → verify 4 seed previews appear
- [ ] **Step 4: Create a preview** — Click "New preview", wait for it to complete
- [ ] **Step 5: Refresh** — All 5 previews should still be there (4 seed + 1 new)
- [ ] **Step 6: Archive a task** — Go to tasks, archive one, refresh → should stay archived
- [ ] **Step 7: Create a task** — Send a message, wait for title generation, refresh → task + messages + title persist
- [ ] **Step 8: Switch persona** — Settings → reset data → choose "new user" → verify empty state
- [ ] **Step 9: Switch back** — Choose "existing user" → verify fresh seed data (not old modifications)

---

## What This Plan Does NOT Change (and Why)

| Area | Why no change |
|------|--------------|
| **Pipeline/sync** | `PipelineStage[]` is embedded in `Site` object, already persisted. `usePipeline` UI state (modals, setup wizard, sync progress) is correctly transient. |
| **Site map** | Derived from `site.mockLayout` at render time. Not stored data. |
| **Site settings** | Fields on `Site` object (`themeType`, `features`, `skillOverrides`), already persisted. |
| **Agents/skills** | Static catalog with localStorage install toggles. Not per-site domain data. |
| **Auth/onboarding** | Restored from persona definition on hydrate. No user-editable profile. |
| **Import/export** | Simulated progress — ephemeral by design. |
| **Add-site wizard** | Form state — correctly resets on close/refresh. |
| **Canvas/transitions** | Viewport state — correctly resets. |
