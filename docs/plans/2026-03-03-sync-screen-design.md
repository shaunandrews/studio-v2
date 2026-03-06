# Sync Screen Design

## Overview

The Sync screen replaces the stub placeholder with a deployment pipeline UI. Users deploy their local WordPress site through environments (staging, QA, production) with push/promote actions between stages. Selective sync (plugins, themes, uploads, database) via a slide-over panel.

Target audience: solo devs and agencies managing client sites with collaborators.

## Mental Model

A **vertical deployment pipeline**. Local is always at the top. Stages flow downward. Push moves content down the pipeline; pull brings it back to local. The pipeline is the hero of the screen — not a settings list, not a sidebar nav.

## Data Model

```typescript
// types.ts additions

export type EnvironmentType = 'staging' | 'qa' | 'review' | 'production' | 'custom'

export interface ConnectedSite {
  id: string
  name: string
  url: string
  provider: 'wpcom' | 'pressable'
  lastPullAt?: string   // ISO timestamp
  lastPushAt?: string
}

export interface PipelineStage {
  id: string
  label: string           // "Staging", "QA", "Production", or custom name
  environment: EnvironmentType
  site?: ConnectedSite    // undefined = not connected
  order: number           // Position in pipeline
}
```

Project type gets `pipeline?: PipelineStage[]`. Local is always implicit (derived from the project itself, not stored in the array). Empty/undefined pipeline = empty state.

### Seed Data

**Downstreet Cafe:**
- Stage 1: Staging → connected to staging.downstreet.cafe (Pressable), last push 2h ago
- Stage 2: Production → connected to downstreet.cafe (wpcom), last push Feb 28

**Studio Meridian:**
- No pipeline (empty state)

## Empty State

Shown when `pipeline` is empty or undefined. Centered in the pane.

```
           Deploy through environments

  Work locally, push to staging to test, then
  promote to production when ready.

  ┌─────────┐       ┌─────────┐       ┌─────────┐
  │  Local  │──────>│ Staging │──────>│  Prod   │
  └─────────┘       └─────────┘       └─────────┘

          [ Set up your pipeline ]
```

- Heading: `font-size-xl`, `font-weight-semibold`, centered
- Subtext: `font-size-s`, `color-text-muted`, centered, max-width ~360px
- Diagram: Three small rounded boxes connected by arrows. Muted treatment — `color-surface-border` for boxes, `color-text-muted` for labels. Pure CSS/HTML.
- CTA: Primary button. Clicking it creates a default two-stage pipeline (Staging + Production, both unconnected) and switches to the pipeline view.

## Pipeline View

Vertically scrolling area, pipeline centered, max-width ~600px.

```
┌─────────────────────────────────────────────┐
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ ● Local                    Running    │  │
│  │   localhost:3920                      │  │
│  │                        Pull from ▾    │  │
│  └───────────────────────────────────────┘  │
│              │                              │
│              │  Push to Staging ▼           │
│              │                              │
│  ┌───────────────────────────────────────┐  │
│  │ ○ Staging              Synced 2h ago  │  │
│  │   staging.downstreet.cafe             │  │
│  │   Pressable                           │  │
│  └───────────────────────────────────────┘  │
│              │                              │
│              │  Promote to Production ▼     │
│              │                              │
│  ┌───────────────────────────────────────┐  │
│  │ ○ Production           Last: Feb 28   │  │
│  │   downstreet.cafe                     │  │
│  │   WordPress.com                       │  │
│  └───────────────────────────────────────┘  │
│              │                              │
│           ( + )  Add stage                  │
│                                             │
└─────────────────────────────────────────────┘
```

## Stage Cards

### Connected

```
┌─────────────────────────────────────────┐
│  ● Staging                  Synced 2h   │
│  staging.downstreet.cafe ↗              │
│  Pressable                   Disconnect │
└─────────────────────────────────────────┘
```

- Environment dot (colored) + label left, relative timestamp right
- URL as external link
- Provider name small/muted
- Disconnect action — text link, tucked away

### Unconnected

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  ○ Production             Not connected

                [ Connect site ]
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

- Dashed border, muted
- Secondary "Connect site" button

### Local (always first)

```
┌─────────────────────────────────────────┐
│  ● Local                     Running    │
│  localhost:3920                          │
│                          Pull from ▾    │
└─────────────────────────────────────────┘
```

- Uses project status (Running/Stopped/Loading) with existing status dot colors
- "Pull from" dropdown lists all connected downstream stages
- No disconnect — always present

### Environment Dot Colors

| Environment | Color |
|-------------|-------|
| Production | `--color-status-running` (green) |
| Staging | `--color-status-warning` (yellow/amber) |
| QA / Review | `--color-primary` (blue) |
| Custom | `--color-text-muted` (gray) |

## Connectors

```
│
│  Push to Staging ▼
│
```

- 1px vertical line, `--color-surface-border`
- Action as tertiary button centered on the line
- Verb: "Push to [next]" from Local, "Promote to [next]" between remote stages

## Add Stage

Sits below the last stage in the pipeline.

- Small `+` circle with "Add stage" text
- Click opens inline picker: choose environment type (Staging, QA, Review, Production, Custom), optionally connect a site immediately

## Sync Dialog (Slide-over Panel)

Triggered by clicking any push/promote/pull action. Slides in from the right edge, ~400px wide. Pipeline remains visible but dimmed behind.

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│  (pipeline dimmed)   │  Push to Staging     │
│                      │                      │
│  ● Local             │  What to sync:       │
│    ┆                 │                      │
│  ○ Staging           │  ☑ Plugins       12  │
│    ┆                 │  ☑ Themes         3  │
│  ○ Production        │  ☑ Uploads      148  │
│                      │  ☑ Database          │
│                      │  ☐ wp-config.php     │
│                      │                      │
│                      │  ──────────────────  │
│                      │  Summary:            │
│                      │  163 files, 1 DB     │
│                      │                      │
│                      │        [ Push ]      │
└──────────────────────┴──────────────────────┘
```

### Panel Anatomy

- **Header:** Action name + close (X) button
- **Checklist:** Categories with checkboxes — Plugins, Themes, Uploads, Database, wp-config.php. File count per category. Click category name to expand and show individual items.
- **Summary:** Total files + database indicator based on selections
- **Action button:** "Push" or "Pull" — primary, full width at bottom

### Progress State

After clicking Push/Pull:
- Checklist replaced by progress bar + status ("Pushing plugins... 34%")
- Items tick off as they complete
- Done: green checkmark + "Synced successfully" + timestamp

### Panel Behavior

- Slides from inline-end, ~400px wide
- Subtle backdrop dims the pipeline
- Close: X button, click dimmed area, or Escape

## Component Inventory

| Component | Purpose |
|-----------|---------|
| `SyncScreen.vue` | Rewrite — orchestrates empty state vs pipeline view |
| `SyncPipeline.vue` | The vertical pipeline with stage cards + connectors |
| `StageCard.vue` | Individual stage card (local, connected, unconnected variants) |
| `PipelineConnector.vue` | Line + action button between stages |
| `SyncPanel.vue` | Slide-over panel for selective sync + progress |
| `SyncEmptyState.vue` | Educational empty state with diagram + CTA |
| `AddStageButton.vue` | The "+" button at the bottom of the pipeline |

## Data Layer

| File | Changes |
|------|---------|
| `types.ts` | Add `EnvironmentType`, `ConnectedSite`, `PipelineStage`. Add `pipeline?` to `Project`. |
| `seed-projects.ts` | Add pipeline data to Downstreet Cafe. Leave Studio Meridian empty. |
| `usePipeline.ts` | New composable — CRUD for pipeline stages, mock sync state/progress. |

## What We're NOT Doing

- No real sync logic — push/pull are simulated with timers
- No "Connect site" modal (the real Studio's is complex) — just toggle connected/unconnected in seed data
- No file diff previews
- No actual file tree fetching — fake data for the checklist
- No drag-to-reorder stages
