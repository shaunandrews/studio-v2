# Granular Export Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the binary "full site" / "database only" export cards with inline granular controls — toggle switches for files and database, scope dropdowns (all/selected), file tree picker, and database table picker — reusing patterns from the Sync modal.

**Architecture:** Extract shared UI (Toggle switch, file tree data, database table data, tree logic) into reusable pieces. Create a `Toggle.vue` primitive, a `useSiteContent.ts` composable for tree/table data and logic, and a `ContentSelector.vue` composite that renders the toggle+scope+picker panel. Refactor SyncModal to consume these, then use them in the export section of ImportExportScreen. Update `useImportExport.ts` to accept granular export options.

**Tech Stack:** Vue 3 SFC, existing design system tokens, `@wordpress/icons`, Dropdown component.

---

### Task 1: Create Toggle.vue primitive

**Files:**
- Create: `src/components/primitives/Toggle.vue`

**Step 1: Build the component**

Extract the toggle switch markup and styles from `SyncModal.vue` (lines 769-829) into a standalone primitive.

Props:
- `modelValue: boolean` (v-model)
- `label?: string` (optional text label rendered beside the switch)

Emits: `update:modelValue`

Template: A `<label>` wrapping a hidden checkbox input + the styled `.toggle__track` span. If `label` is provided, render it as a `<span>` with the label styling from SyncModal (font-size-m, font-weight-medium, color frame-fg).

Styles: Copy the `.toggle`, `.toggle__input`, `.toggle__track`, `.toggle__track::before` styles from SyncModal. Use design system tokens throughout. The toggle track border should use `var(--color-frame-border)` instead of the hardcoded `#949494` in SyncModal.

**Step 2: Verify build**

```
npx vue-tsc --noEmit && npx vite build
```

**Step 3: Commit**

```
git add src/components/primitives/Toggle.vue
git commit -m "feat: add Toggle primitive component"
```

---

### Task 2: Create useSiteContent.ts composable

**Files:**
- Create: `src/data/useSiteContent.ts`

**Step 1: Extract tree and table data structures**

Move these from SyncModal into the composable:
- `TreeNode` interface (id, label, type, children, checked, expanded)
- `TableEntry` interface (id, label, checked)
- `createTree()` function (the seed file tree data)
- `createTables()` function (the seed database tables)
- `CheckState` type
- `getNodeState()`, `setAllChecked()`, `toggleNode()`, `toggleExpand()` functions
- `FlatNode` interface and the `flatNodes` computed

The composable function `useSiteContent()` should return:
- `filesEnabled: Ref<boolean>` (default true)
- `databaseEnabled: Ref<boolean>` (default true)
- `filesScope: Ref<'all' | 'selected'>` (default 'all')
- `databaseScope: Ref<'all' | 'selected'>` (default 'all')
- `fileTree: Ref<TreeNode[]>`
- `dbTables: Ref<TableEntry[]>`
- `flatNodes: ComputedRef<FlatNode[]>`
- `getNodeState`, `toggleNode`, `toggleExpand` functions
- `filesScopeGroups`, `databaseScopeGroups` (static dropdown option arrays)
- `reset()` function that resets all state to defaults
- `exportType: ComputedRef<'full' | 'database' | 'files'>` — derived from toggles:
  - files on + database on = 'full'
  - files off + database on = 'database'
  - files on + database off = 'files'
- `canExport: ComputedRef<boolean>` — true when at least one toggle is on

Also include the watchers from SyncModal that reset checked state when switching to "selected" scope.

Export the interfaces too (`TreeNode`, `TableEntry`, `FlatNode`, `CheckState`).

**Step 2: Verify build**

```
npx vue-tsc --noEmit && npx vite build
```

**Step 3: Commit**

```
git add src/data/useSiteContent.ts
git commit -m "feat: add useSiteContent composable for file/database selection"
```

---

### Task 3: Create ContentSelector.vue composite

**Files:**
- Create: `src/components/composites/ContentSelector.vue`

**Step 1: Build the component**

This renders the bordered panel with toggleable Files and Database sections. It consumes `useSiteContent()` internally (or accepts it via props — use internal for simplicity since it's a self-contained panel).

No props needed — it manages its own state via the composable. Expose the composable's return values via `defineExpose` so parent components can read `exportType`, `canExport`, `filesEnabled`, `databaseEnabled`, etc.

Template structure (matching SyncModal's `.sync-options` pattern):

```html
<div class="content-selector">
  <!-- Files section -->
  <div class="content-selector__section">
    <div class="content-selector__header">
      <Toggle v-model="filesEnabled" label="Files and folders" />
      <Dropdown v-if="filesEnabled" v-model="filesScope" :groups="filesScopeGroups" ... />
    </div>
    <div v-if="filesEnabled && filesScope === 'selected'" class="content-selector__picker">
      <!-- File tree rows (same markup as SyncModal lines 454-480) -->
    </div>
  </div>

  <div class="content-selector__divider" />

  <!-- Database section -->
  <div class="content-selector__section">
    <div class="content-selector__header">
      <Toggle v-model="databaseEnabled" label="Database" />
      <Dropdown v-if="databaseEnabled" v-model="databaseScope" :groups="databaseScopeGroups" ... />
    </div>
    <div v-if="databaseEnabled && databaseScope === 'selected'" class="content-selector__picker">
      <!-- Table rows (same markup as SyncModal lines 508-512) -->
    </div>
  </div>
</div>
```

Styles: Port the `.sync-options`, `.sync-section__header`, `.sync-selector`, `.tree-row`, `.table-row` styles from SyncModal, renamed to use `content-selector__` prefix. Use design system tokens. Include the `v-indeterminate` directive for checkbox indeterminate state.

Import icons: `file`, `page`, `brush`, `blockTable`, `chevronDownSmall` from `@wordpress/icons`.

**Step 2: Verify build**

```
npx vue-tsc --noEmit && npx vite build
```

**Step 3: Commit**

```
git add src/components/composites/ContentSelector.vue
git commit -m "feat: add ContentSelector composite for file/database selection UI"
```

---

### Task 4: Update useImportExport to support granular export

**Files:**
- Modify: `src/data/useImportExport.ts`

**Step 1: Update startExport to accept 'files' type**

Change the `exportType` in `ExportState` from `'full' | 'database'` to `'full' | 'database' | 'files'`.

Add a new `exportFilesMessages` array for files-only export:
```typescript
const exportFilesMessages = [
  { progress: 15, message: 'Backing up files...' },
  { progress: 40, message: 'Backing up files...' },
  { progress: 70, message: 'Backing up files...' },
  { progress: 90, message: 'Compressing archive...' },
  { progress: 100, message: 'Files exported! File saved to ~/Downloads' },
]
```

Add a new stage definition:
```typescript
const EXPORT_STAGES_FILES = [
  { label: 'Files', key: 'files' },
  { label: 'Compressing', key: 'compress' },
] as const
```

Update `startExport` to handle the `'files'` type — select the right messages and stages.

Export `EXPORT_STAGES_FILES` from the composable.

**Step 2: Verify build**

```
npx vue-tsc --noEmit && npx vite build
```

**Step 3: Commit**

```
git add src/data/useImportExport.ts
git commit -m "feat: support files-only export type in useImportExport"
```

---

### Task 5: Update ImportExportScreen export section

**Files:**
- Modify: `src/components/features/ImportExportScreen.vue`

**Step 1: Replace the export cards with ContentSelector + Export button**

Remove the two-card layout (`.ie__export-cards` and children). Replace with:

```html
<div class="ie__export">
  <Text variant="label" color="muted" tag="h3">Export</Text>

  <Transition name="ie-fade" mode="out-in">
    <!-- Idle: options panel + button -->
    <div v-if="!isExporting && !isExportDone" key="export-idle" class="ie__export-options">
      <ContentSelector ref="contentSelectorRef" />
      <Button
        variant="primary"
        label="Export"
        :disabled="exportDisabled || !canExport"
        width="full"
        @click="handleExport"
      />
    </div>

    <!-- Exporting / Done states stay the same -->
  </Transition>
</div>
```

Add a `contentSelectorRef` template ref. Read `canExport` and `exportType` from the exposed composable values on the ContentSelector.

Add `handleExport` function:
```typescript
function handleExport() {
  const type = contentSelectorRef.value?.exportType ?? 'full'
  startExport(type)
}

const canExport = computed(() => contentSelectorRef.value?.canExport ?? true)
```

Update the `activeExportStages` computed to also handle the `'files'` export type using `EXPORT_STAGES_FILES`.

**Step 2: Remove dead CSS**

Remove `.ie__export-cards`, `.ie__export-card`, `.ie__export-card:hover`, `.ie__export-card-icon` styles. Remove the `wordpress` and `page` icon imports if no longer used.

**Step 3: Verify build**

```
npx vue-tsc --noEmit && npx vite build
```

**Step 4: Commit**

```
git add src/components/features/ImportExportScreen.vue
git commit -m "feat: granular export controls with ContentSelector"
```

---

### Task 6: Refactor SyncModal to use shared components

**Files:**
- Modify: `src/components/features/sync/SyncModal.vue`

**Step 1: Replace inline toggle with Toggle primitive**

Replace the inline `<label class="toggle-label">` + `<span class="toggle">` + `<input>` + `<span class="toggle__track">` pattern with `<Toggle v-model="filesEnabled" label="Files and folders" />` and `<Toggle v-model="databaseEnabled" label="Database" />`.

**Step 2: Use useSiteContent composable**

Replace the inline state declarations (filesEnabled, databaseEnabled, filesScope, databaseScope, fileTree, dbTables, flatNodes, createTree, createTables, getNodeState, setAllChecked, toggleNode, toggleExpand, TreeNode, TableEntry, FlatNode, CheckState, filesScopeGroups, databaseScopeGroups, watchers) with a call to `useSiteContent()`.

Keep the SyncModal-specific code: direction, environments, sync visual, description text, header/footer.

Update the reset watcher (`watch(() => props.open, ...)`) to call `siteContent.reset()` instead of manually resetting each piece.

**Step 3: Remove dead CSS**

Remove `.toggle-label`, `.toggle`, `.toggle__input`, `.toggle__track`, `.toggle__track::before`, `.toggle__input:checked + .toggle__track`, `.toggle__input:checked + .toggle__track::before` styles from SyncModal (these now live in Toggle.vue).

Keep `.sync-section__header`, `.sync-selector`, `.tree-row`, `.table-row` styles since SyncModal still renders the tree/table inline (it doesn't use ContentSelector because it has the sync visual context around it).

Actually — SyncModal should NOT use ContentSelector since it has its own layout (the sync visual cards, direction controls, etc. are interleaved). SyncModal should just use `useSiteContent()` for data and `Toggle.vue` for the switch component. The tree/table rendering stays inline in SyncModal.

**Step 4: Verify build**

```
npx vue-tsc --noEmit && npx vite build
```

**Step 5: Commit**

```
git add src/components/features/sync/SyncModal.vue src/components/primitives/Toggle.vue
git commit -m "refactor: SyncModal uses Toggle primitive and useSiteContent composable"
```

---

### Task 7: Visual polish and dark mode check

**Step 1: Verify dark mode**

All new components must use `--color-frame-*` tokens. Check Toggle.vue, ContentSelector.vue for any hardcoded colors.

**Step 2: Check spacing**

All spacing uses `--space-*` tokens. No magic numbers.

**Step 3: Test the full flow**

Walk through: toggle files off -> toggle database on -> select "Selected tables" -> uncheck some tables -> click Export -> watch stepper -> done -> export again.

**Step 4: Commit any fixes**

```
git add -A
git commit -m "fix: dark mode and spacing polish for export controls"
```
