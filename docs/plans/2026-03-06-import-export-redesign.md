# Import/Export Screen Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Import/Export screen with delightful interactions, better UX flow, and visual polish.

**Architecture:** Single-column stacked layout replacing the two-column grid. Import section becomes an interactive drop zone with floating format pills and a confirmation step. Export section gets descriptive option cards. Both share a new segmented progress stepper with animated checkmark completion. All state changes animate smoothly.

**Tech Stack:** Vue 3 (SFC), CSS animations/transitions, existing design system tokens, `@wordpress/icons` via WPIcon.

---

### Task 1: Update the composable — add confirmation step and file metadata

**Files:**
- Modify: `src/data/useImportExport.ts`

**Step 1: Add confirmation phase and file metadata to ImportState**

Update the `ImportPhase` type to include a `'confirm'` phase between idle and importing. Add `fileSize` to `ImportState`. Update `startImport` to accept a file size parameter and land in the `'confirm'` phase first. Add a `confirmImport()` function that transitions from confirm to importing. Add `cancelImport()` to go back to idle.

Update progress messages to be more granular with 4 named stages:

```typescript
export type ImportPhase = 'idle' | 'confirm' | 'importing' | 'done' | 'error'

interface ImportState {
  phase: ImportPhase
  progress: number
  statusMessage: string
  fileName: string
  fileSize: number
  currentStage: number // 0-3 index into stages
}

const IMPORT_STAGES = [
  { label: 'Extracting', key: 'extract' },
  { label: 'Database', key: 'database' },
  { label: 'Content', key: 'content' },
  { label: 'Finishing', key: 'finish' },
] as const

const EXPORT_STAGES_FULL = [
  { label: 'Files', key: 'files' },
  { label: 'Database', key: 'database' },
  { label: 'Compressing', key: 'compress' },
] as const

const EXPORT_STAGES_DB = [
  { label: 'Exporting', key: 'export' },
  { label: 'Writing', key: 'write' },
] as const
```

Add `currentStage` to `ExportState` as well.

**Step 2: Add helper to format file sizes**

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
```

**Step 3: Update startImport to land in confirm phase**

```typescript
function startImport(fileName: string, fileSize: number) {
  const id = siteId.value
  if (!id || isImporting.value || isExporting.value) return

  importStates.value[id] = {
    phase: 'confirm',
    progress: 0,
    statusMessage: '',
    fileName,
    fileSize,
    currentStage: 0,
  }
}
```

**Step 4: Add confirmImport and cancelImport**

`confirmImport()` transitions to `'importing'` and starts the simulated progress (which now also increments `currentStage` at appropriate thresholds). `cancelImport()` deletes the state.

**Step 5: Update simulateProgress to track stages**

The progress simulation should update `currentStage` as progress crosses thresholds (e.g., 0-25% = stage 0, 25-50% = stage 1, etc.). Each stage array has a different number of stages, so compute thresholds dynamically.

**Step 6: Export return values**

Add `confirmImport`, `cancelImport`, `formatFileSize`, `IMPORT_STAGES`, `EXPORT_STAGES_FULL`, `EXPORT_STAGES_DB` to the returned object. Also add `isConfirming` computed.

**Step 7: Commit**

```
git add src/data/useImportExport.ts
git commit -m "feat(import-export): add confirmation step, file metadata, and staged progress"
```

---

### Task 2: Build the drop zone with floating format pills

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Replace the import card with the new drop zone**

Remove the card layout and box illustrations entirely. Build a new import section with:

- A `div.ie__dropzone` that serves as the full-width drop target
- Inside: floating format pills rendered from `ACCEPTED_FILE_TYPES`, each with a subtle CSS animation for idle drift
- "Choose file..." button centered below the pills
- "or drag a file anywhere" hint below the button

The format pills should each have a slightly randomized animation delay so they drift out of sync (use inline `style` with `--delay` custom property).

**Step 2: Style the floating pills**

Each pill is a small rounded badge showing a file extension. Apply a `@keyframes pill-drift` animation that translates Y by ~4px and back, with a duration of ~3s and the per-pill delay variable:

```css
@keyframes pill-drift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.ie__format-pill {
  animation: pill-drift 3s var(--ease-in-out) infinite;
  animation-delay: var(--delay);
}
```

**Step 3: Style the dropzone idle state**

Dashed border, rounded corners, generous padding. Subtle background. The border should transition color on hover.

**Step 4: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): drop zone with floating format pills"
```

---

### Task 3: Drag interactions — pill magnetism and overlay

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Update the drag state to affect pill animation**

When `isDragging` is true, add a class to the dropzone that:
- Pauses the drift animation on pills
- Applies a CSS transition that moves all pills toward center (use `transform: translate()` toward 0,0 from their spread positions)
- Pulses the border using a `@keyframes border-pulse` animation
- Brightens the background

```css
.ie__dropzone.is-dragging .ie__format-pill {
  animation: none;
  transform: translateY(0) scale(0.9);
  opacity: 0.5;
  transition: all var(--duration-slow) var(--ease-out);
}

@keyframes border-pulse {
  0%, 100% { border-color: var(--color-frame-theme); }
  50% { border-color: color-mix(in srgb, var(--color-frame-theme) 50%, transparent); }
}
```

**Step 2: Update the drop overlay**

Keep the existing overlay but improve it — use a frosted glass effect with `backdrop-filter: blur(8px)` and a downward arrow icon that bounces gently.

**Step 3: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): drag interactions with pill magnetism"
```

---

### Task 4: Confirmation step UI

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Build the confirmation state view**

When `isConfirming` is true, the dropzone transforms to show:
- The file name (truncated with ellipsis if long) and formatted file size in a pill/badge
- Warning text: "This will replace the current site."
- Two buttons: "Import" (primary) and "Cancel" (secondary)

The file info pill should slide in from below using a CSS transition (`TransitionGroup` or Vue `<Transition>`).

**Step 2: Wire up the buttons**

"Import" calls `confirmImport()`, "Cancel" calls `cancelImport()`.

**Step 3: Update the file drop/select handlers**

Pass `file.size` to `startImport(file.name, file.size)`.

**Step 4: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): file confirmation step with metadata display"
```

---

### Task 5: Segmented progress stepper

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Build the progress stepper component inline**

Replace the thin progress bar with a horizontal stepper showing the stage labels. Each stage has:
- A small dot/circle indicator
- A label below
- States: pending (muted), active (pulsing theme color), done (solid theme with checkmark)

```html
<div class="ie__stepper">
  <div
    v-for="(stage, i) in stages"
    :key="stage.key"
    class="ie__step"
    :class="{
      'is-done': i < currentStage,
      'is-active': i === currentStage,
      'is-pending': i > currentStage,
    }"
  >
    <div class="ie__step-dot">
      <svg v-if="i < currentStage" class="ie__step-check" ...checkmark svg... />
    </div>
    <span class="ie__step-label">{{ stage.label }}</span>
  </div>
</div>
```

Connect the steps with a line (using `::before` pseudo-element on each step except the first).

**Step 2: Style the stepper**

```css
.ie__step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-frame-border);
  transition: all var(--duration-moderate) var(--ease-out);
}

.ie__step.is-active .ie__step-dot {
  border-color: var(--color-frame-theme);
  animation: step-pulse 1.5s var(--ease-in-out) infinite;
}

.ie__step.is-done .ie__step-dot {
  background: var(--color-frame-theme);
  border-color: var(--color-frame-theme);
}

@keyframes step-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-frame-theme) 40%, transparent); }
  50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-frame-theme) 0%, transparent); }
}
```

**Step 3: Add the status message below the stepper**

Keep the text status message from the composable displayed below the stepper for additional context.

**Step 4: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): segmented progress stepper with pulse animation"
```

---

### Task 6: Animated checkmark completion

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Build the SVG checkmark with draw-on animation**

When import or export completes, show an animated checkmark using `stroke-dasharray` / `stroke-dashoffset`:

```html
<svg class="ie__checkmark" viewBox="0 0 36 36" width="36" height="36">
  <circle class="ie__checkmark-circle" cx="18" cy="18" r="16" />
  <path class="ie__checkmark-check" d="M11 18 L16 23 L25 13" />
</svg>
```

```css
.ie__checkmark-circle {
  fill: none;
  stroke: var(--color-frame-theme);
  stroke-width: 2;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: checkmark-circle 400ms var(--ease-out) forwards;
}

.ie__checkmark-check {
  fill: none;
  stroke: var(--color-frame-theme);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: checkmark-draw 300ms var(--ease-out) 300ms forwards;
}

@keyframes checkmark-circle {
  to { stroke-dashoffset: 0; }
}

@keyframes checkmark-draw {
  to { stroke-dashoffset: 0; }
}
```

**Step 2: Add completion message and actions below checkmark**

Import done: "Import complete!" + "Open site" button + "Import another" link.
Export done: "Export complete! Saved to ~/Downloads" + "Export again" link.

These should fade in after the checkmark finishes (use `animation-delay`).

**Step 3: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): animated SVG checkmark on completion"
```

---

### Task 7: Export section redesign

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Replace the export card with two descriptive option cards**

Side-by-side within the export section:

Card 1 — "Full site backup":
- WPIcon (e.g. `wordpress` or `backup`)
- Description: "Database, themes, plugins, uploads, and configuration"
- Primary button

Card 2 — "Database only":
- WPIcon (e.g. `tableOfContents` or similar)
- Description: "Export a .sql dump of your site database"
- Secondary button

Each card should have a hover state (slight scale or border highlight).

**Step 2: Wire existing export functions to new cards**

Card 1 click -> `startExport('full')`, Card 2 click -> `startExport('database')`.

**Step 3: Show stepper and checkmark for export progress/done**

Reuse the same stepper and checkmark patterns from the import section, but with the export-specific stages from the composable.

**Step 4: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): export section with descriptive option cards"
```

---

### Task 8: Smooth state transitions

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Wrap all state views in Vue `<Transition>` components**

Each section (idle, confirm, importing, done) should crossfade when transitioning. Use a named transition like `ie-fade` with:

```css
.ie-fade-enter-active,
.ie-fade-leave-active {
  transition: opacity var(--duration-moderate) var(--ease-default),
              transform var(--duration-moderate) var(--ease-default);
}

.ie-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.ie-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
```

Use `mode="out-in"` so the outgoing view exits before the incoming one enters.

**Step 2: Verify all transitions work end-to-end**

Walk through the full flow: idle -> drag -> drop -> confirm -> importing (stages) -> done -> start again -> idle. Same for export.

**Step 3: Final cleanup and commit**

Remove any dead code from the old layout (box illustrations, old grid styles, old progress bar). Clean up class names.

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat(import-export): smooth state transitions and cleanup"
```

---

### Task 9: Visual review and polish

**Step 1: Check dark mode**

All new elements must work with dark mode tokens. Verify the pills, stepper dots, checkmark, and card borders all use `--color-frame-*` variables (no hardcoded colors).

**Step 2: Check spacing**

All padding, gaps, and margins must use `--space-*` tokens. No magic numbers except for animation values (translateY, dasharray, etc.).

**Step 3: Commit any fixes**

```
git add -A
git commit -m "fix(import-export): dark mode and spacing polish"
```
