# Data System

Studio v2 uses a site-first data model with IndexedDB persistence. The Site is the primary entity — tasks, previews, pipeline stages, and settings all hang off it.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Components  │────▸│  Composables │────▸│   Dexie DB   │
│  (read refs) │◂────│  (refs + fn) │◂────│  (IndexedDB) │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │  localStorage │  (prefs only)
                    └─────────────┘
```

**Three persistence tiers:**

| Tier | Mechanism | What belongs here |
|------|-----------|-------------------|
| **DB** | IndexedDB via Dexie | Domain data: sites, tasks, messages, previews |
| **Prefs** | localStorage | UI preferences: sidebar state, OS mode, view toggles, agent/skill installs |
| **Memory** | Vue refs only | Transient UI: modals, wizards, drag state, transitions |

## Database (`src/data/db.ts`)

Single Dexie database `studio-v2` with indexed tables:

```typescript
sites:       'id'
tasks:       'id, siteId, status, updatedAt, [siteId+archived]'
messages:    'id, taskId, timestamp'
previews:    'id, siteId, status'
siteContent: 'siteId'
revisions:   'id, siteId, taskId, timestamp'
```

Schema changes require incrementing `this.version(N)` and adding an upgrade function.

## Write-through pattern

Every mutation follows the same pattern:

1. Mutate the Vue ref (instant UI update)
2. Persist to IndexedDB (async, fire-and-forget for non-critical writes)

```typescript
async function archiveTask(id: string) {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    task.archived = true                          // 1. ref update
    task.updatedAt = new Date().toISOString()
    await persistTask(task)                       // 2. DB write
  }
}
```

**Persist helpers** must strip Vue's reactive Proxy before writing to Dexie:

```typescript
async function persistTask(task: Task) {
  if (await isDbAvailable()) {
    const raw = JSON.parse(JSON.stringify(toRaw(task)))
    await db.tasks.put(raw)
  }
}
```

`toRaw()` unwraps the Vue Proxy; `JSON.parse(JSON.stringify())` deep-clones to strip any remaining nested Proxies. Without this, Dexie silently drops or corrupts data.

**Streaming exception:** During AI response streaming, only update refs in memory on each token. Persist a single `db.messages.put()` after streaming completes.

## Hydration (`src/data/useHydration.ts`)

Boot sequence on app load:

1. Router `beforeEach` calls `hydrate(personaId)`
2. Check `db.sites.count()`
3. If 0 → first load: seed all tables from persona data via `bulkPut`
4. If >0 → returning visit: read all rows into Vue refs
5. Restore auth + onboarding state from persona (not persisted in DB)
6. Set `ready = true`

The `_setSites()`, `_setTasks()`, and `_setPreviews()` methods set refs without touching the DB — used only during hydration to avoid a redundant clear+write cycle.

## Persona system (`src/data/usePersona.ts`)

Personas provide seed data for different user scenarios. `activatePersona()`:

1. Clears all 4 DB tables in a transaction
2. Seeds from persona's `sites`, `tasks`, `messages`, `previews` arrays
3. Resets all in-memory composable state
4. Stores persona ID in localStorage

On refresh, the router reads the persona ID from localStorage and calls `hydrate()` — which loads from DB rather than re-seeding.

## Fallback

If IndexedDB is unavailable (e.g., some private browsing modes), `isDbAvailable()` returns false and all DB writes are silently skipped. The app works in-memory with persona seed data, losing state on refresh.

## Adding persistence to a composable

To add IndexedDB persistence to an existing in-memory composable:

1. **Add a table** to `db.ts` — increment version, define indexes
2. **Add persist helper** — `async function persistFoo(foo: Foo)` using the `toRaw` + `JSON.parse` pattern
3. **Write-through** — every mutation calls the persist helper after updating the ref
4. **Hydration** — add a `_setFoo()` setter, call it from `useHydration.hydrate()`
5. **Persona reset** — update `activatePersona()` to clear + re-seed the new table
6. **Seed data** — add to persona if the composable needs initial data

## Current persistence coverage

### Persisted in IndexedDB
- **Sites** — `useSites.ts` → `db.sites` (includes embedded pipeline stages, skill overrides)
- **Tasks** — `useTasks.ts` → `db.tasks` (includes worktree, changed files/entities)
- **Messages** — `useTasks.ts` → `db.messages`
- **Previews** — `usePreviews.ts` → `db.previews` (includes invites, view counts)
- **Site content** — `useSiteDocument.ts` → `db.siteContent` (pages, sections, theme)
- **Revisions** — `useRevisions.ts` → `db.revisions` (full SiteContent snapshots per AI turn)

### Persisted in localStorage
- Sidebar collapse state (`useSidebarCollapse`)
- OS preference (`useOperatingSystem`)
- All-sites view toggle (`useAllSitesView`)
- Resizable pane widths (`useResizablePane`)
- Active persona ID (`usePersona`)
- Agent install state (`agents.ts`)
- Skill install state + custom skills (`skills.ts`)
- API key (`ai-service.ts`)

### Intentionally in-memory only
- **Auth** — restored from persona on hydration
- **Onboarding** — restored from persona on hydration
- **Settings modal** — transient UI state
- **Add-site wizard** — transient wizard state
- **Site transitions** — transient animation state
- **Site content selections** — transient wizard state
- **Import/export progress** — simulated progress, ephemeral by design
- **Pipeline setup phase** — wizard state for sync setup flow
- **Sync modal/progress** — transient operation UI
- **Canvas pan/zoom** — viewport state, resets on mount
