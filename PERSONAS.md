# Personas

Personas provide pre-built user scenarios for designing and testing different stages of the Studio experience. Each persona is a complete snapshot of application state — sites, tasks, messages, previews, auth, and onboarding — that seeds the app with realistic data for a specific user journey.

This is a design/prototyping tool, not a user-facing feature. Personas let the team rapidly switch between "new user with no data," "single-site owner just getting started," and "power user with a full setup" without manually creating state each time.

## Architecture

```
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│  PersonaChooser  │────▸│  usePersona  │────▸│   Dexie DB   │
│  (/choose)       │     │  composable  │     │  (IndexedDB) │
└──────────────────┘     └──────┬───────┘     └──────────────┘
                               │
                        ┌──────┴──────┐
                        │ localStorage │  (persona ID only)
                        └─────────────┘
```

On first visit, the router redirects to `/choose`. The user picks a persona, which seeds IndexedDB and sets in-memory state. On subsequent visits, the persona ID is read from localStorage and data is loaded from IndexedDB — the persona definition is not re-applied.

## Data structure

### `Persona` (`src/data/types.ts`)

```typescript
interface Persona {
  id: string                  // Unique key ('new-user', 'single-site', 'existing-user')
  name: string                // Display name shown in chooser
  description: string         // One-liner describing the scenario
  icon: string                // Emoji or image URL (Gravatar)
  auth: AuthUser | null       // WordPress.com auth state, or null if not signed in
  onboardingCompleted: boolean // Whether to skip the onboarding flow
  sites: Site[]               // Pre-seeded sites
  tasks: Task[]               // Pre-seeded tasks (linked to sites via siteId)
  messages: Message[]         // Pre-seeded chat messages (linked to tasks via taskId)
  previews: PreviewSite[]     // Pre-seeded preview/sharing data (linked to sites via siteId)
}

interface AuthUser {
  name: string    // Full name
  email: string   // Email address
  avatar: string  // Avatar URL (typically Gravatar)
}
```

### Entity relationships

```
Persona
  ├── auth: AuthUser | null          → restored to useAuth (memory only)
  ├── onboardingCompleted            → restored to useOnboarding (memory only)
  ├── sites[]                        → seeded into db.sites
  │     └── Site { id, name, url, status, ... }
  ├── tasks[]                        → seeded into db.tasks
  │     └── Task { id, siteId, agentId, title, worktree, ... }
  ├── messages[]                     → seeded into db.messages
  │     └── Message { id, taskId, role, content, toolCalls[], ... }
  └── previews[]                     → seeded into db.previews
        └── PreviewSite { id, siteId, name, status, views, invites[], ... }
```

Auth and onboarding state are **not** persisted to IndexedDB — they are restored from the persona definition on every app load via `useHydration`.

## Built-in personas (`src/data/personas.ts`)

| ID | Name | Auth | Onboarding | Sites | Tasks | Description |
|----|------|------|------------|-------|-------|-------------|
| `new-user` | New User | `null` | `false` | 0 | 0 | First launch. No sites, no account. Routes to `/welcome` onboarding. |
| `single-site` | Jamie | Jamie Rivera | `true` | 1 | 0 | Signed in with one empty site. Just finished onboarding. |
| `existing-user` | Shaun | Shaun Andrews | `true` | 7 | 16 | Full setup with all seed sites, active tasks, chat history, and previews. |

Seed data is imported from:

- `src/data/seed-sites.ts` — 7 sample sites
- `src/data/seed-tasks.ts` — tasks linked to specific sites
- `src/data/seed-messages.ts` — chat messages with tool calls
- `src/data/seed-sharing.ts` — preview/sharing data
- `src/data/seed-revisions.ts` — generated from messages during hydration

## Persona selection

### Resolution order (`getInitialPersonaId()`)

On app load, the persona is resolved in this order:

1. **URL param** — `?persona=existing-user` (highest priority, useful for sharing links)
2. **localStorage** — `studio-persona` key
3. **None** — redirects to `/choose`

### PersonaChooser UI (`src/components/features/PersonaChooser.vue`)

Full-screen dark overlay at route `/choose` (bare layout, no app chrome). Shows:

- Title: "WordPress Studio" with subtitle "Choose a scenario"
- One button per persona showing icon, name, description, site count, and auth status
- "Reset local data" button that clears all state and returns to the chooser

## Activation lifecycle

When a user selects a persona, `activatePersona(id, router)` in `usePersona.ts` runs:

```
1. Reset all composable state
   └── resetSites(), resetTasks(), resetPreviews(), resetAddSite(),
       resetSettings(), resetAuth(), resetOnboarding()

2. Clear all IndexedDB tables (atomic transaction)
   └── db.sites, db.tasks, db.messages, db.previews,
       db.siteContent, db.revisions

3. Seed IndexedDB from persona arrays (same transaction)
   └── db.sites.bulkPut(), db.tasks.bulkPut(),
       db.messages.bulkPut(), db.previews.bulkPut()

4. Hydrate composables from persona data
   └── resetSites(sites), resetTasks(tasks, messages),
       resetPreviews(previews), resetAuth(auth),
       resetOnboarding(onboardingCompleted)

5. Persist persona ID
   └── localStorage.setItem('studio-persona', id)

6. Mark hydration ready
   └── useHydration().ready = true

7. Navigate to starting point
   └── !onboardingCompleted → '/welcome'
       has sites → '/sites/:firstSiteId'
       no sites → '/add-site'
```

Steps 2–3 happen inside a single Dexie transaction for atomicity. If IndexedDB is unavailable (e.g. private browsing), DB writes are silently skipped and the app runs in-memory from persona data.

## Hydration on reload (`src/data/useHydration.ts`)

On subsequent page loads (persona already chosen):

1. Router `beforeEach` reads persona ID from localStorage
2. Calls `hydrate(personaId)` which:
   - Restores auth and onboarding state from the persona definition (always, since these aren't in DB)
   - Checks `db.sites.count()` — if 0, seeds from persona; if >0, loads from DB
   - Reads all tables into Vue refs via `_setSites()`, `_setTasks()`, etc.
   - Generates seed revisions from messages if the revisions table is empty
3. Sets `ready = true`, unblocking app rendering

This means persona data is the **initial seed only** — once the user modifies state (adds sites, sends messages), those changes persist in IndexedDB and survive reloads.

## Router integration (`src/router.ts`)

The router enforces persona selection before allowing access to app routes:

- **No persona chosen** → redirect to `/choose`
- **Persona chosen, onboarding incomplete** → redirect to `/welcome`
- **Persona chosen, onboarding complete** → allow normal routing

The `/choose` and `/welcome` routes use `meta: { setup: true }` to bypass the onboarding guard.

## Clearing state

`clearPersona(router)` resets everything:

1. Clears `activePersonaId` ref and removes localStorage key
2. Clears all 6 IndexedDB tables in a transaction
3. Resets site content and revisions
4. Sets `ready = false`
5. Navigates to `/choose`

This is triggered by the "Reset local data" button in the PersonaChooser.

## Adding a new persona

1. **Define seed data** — create or reuse arrays of `Site[]`, `Task[]`, `Message[]`, `PreviewSite[]`
2. **Add to `src/data/personas.ts`** — append a new object to the `personas` array:

```typescript
{
  id: 'my-persona',
  name: 'Display Name',
  description: 'What this scenario demonstrates.',
  icon: '🎨',  // or a Gravatar/image URL
  auth: { name: 'Full Name', email: 'email@example.com', avatar: '...' },  // or null
  onboardingCompleted: true,  // false to test onboarding flow
  sites: mySites,
  tasks: myTasks,
  messages: myMessages,
  previews: myPreviews,
}
```

3. **Test** — reload the app or navigate to `/choose` to see the new persona. Use `?persona=my-persona` for direct activation.

No changes to the router, hydration, or activation logic are needed — the system picks up any persona added to the array.

## Key files

| File | Role |
|------|------|
| `src/data/types.ts` | `Persona` and `AuthUser` type definitions |
| `src/data/personas.ts` | Persona definitions and `getPersona()` lookup |
| `src/data/usePersona.ts` | `activatePersona()`, `clearPersona()`, persona ID state |
| `src/data/useHydration.ts` | `hydrate()` — boots app state from DB or persona seed |
| `src/components/features/PersonaChooser.vue` | Chooser UI at `/choose` |
| `src/router.ts` | Route guards enforcing persona selection |
| `src/data/seed-sites.ts` | Sample site data |
| `src/data/seed-tasks.ts` | Sample task data |
| `src/data/seed-messages.ts` | Sample message data |
| `src/data/seed-sharing.ts` | Sample preview/sharing data |
| `src/data/seed-revisions.ts` | Revision generation from messages |
