# Collapsible Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to collapse the project sidebar to a narrow icon rail (favicons + back icon + "+" button), giving more horizontal space to chat + preview.

**Architecture:** A new `useSidebarCollapse` singleton composable owns a `collapsed` boolean persisted to localStorage. MainLayout passes it to ProjectList, which passes it to ProjectItem. CSS transitions on `width` animate the sidebar from 210px → 45px while text labels fade out and favicons center. The frame's `left` offset uses a CSS custom property `--sidebar-w` that transitions in sync.

**Tech Stack:** Vue 3 Composition API, CSS transitions, localStorage, @wordpress/icons

---

### Task 1: Create `useSidebarCollapse` composable

**Files:**
- Create: `src/data/useSidebarCollapse.ts`

**Step 1: Create the composable**

```ts
import { ref, watch } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

const collapsed = ref<boolean>(
  localStorage.getItem(STORAGE_KEY) === 'true'
)

watch(collapsed, (val) => {
  localStorage.setItem(STORAGE_KEY, String(val))
})

export function useSidebarCollapse() {
  function toggle() { collapsed.value = !collapsed.value }
  function collapse() { collapsed.value = true }
  function expand() { collapsed.value = false }

  return { collapsed, toggle, collapse, expand }
}
```

**Step 2: Verify** — Import it in MainLayout temporarily and `console.log(collapsed.value)` to confirm it reads from localStorage. Remove the log.

**Step 3: Commit**

```bash
git add src/data/useSidebarCollapse.ts
git commit -m "feat: add useSidebarCollapse composable with localStorage persistence"
```

---

### Task 2: Wire sidebar collapse into MainLayout

**Files:**
- Modify: `src/layouts/MainLayout.vue`

This task adds the CSS custom property, the collapsed class, transitions on the sidebar/frame, and the `Cmd+B` keyboard shortcut.

**Step 1: Import and wire composable**

In the `<script setup>` block, add:

```ts
import { useSidebarCollapse } from '@/data/useSidebarCollapse'

const { collapsed, toggle: toggleSidebar } = useSidebarCollapse()
```

**Step 2: Add Cmd+B handler**

In the existing `onGlobalKeydown` function, add a case for `Cmd+B`:

```ts
// Inside onGlobalKeydown, after the Cmd+/ block:
if ((e.metaKey || e.ctrlKey) && e.key === 'b' && mode.value === 'project') {
  e.preventDefault()
  toggleSidebar()
}
```

**Step 3: Update template — left-column**

Add `collapsed` class and pass the CSS variable via inline style. Change the left-column element:

```html
<div
  class="left-column vstack"
  :class="{ 'is-sidebar': mode === 'project', 'is-collapsed': mode === 'project' && collapsed }"
  :style="{
    viewTransitionName: mode === 'project' ? 'sidebar' : 'project-grid',
  }"
>
```

**Step 4: Update template — ProjectList in sidebar mode**

Pass `collapsed` prop to the sidebar-mode ProjectList:

```html
<ProjectList v-else class="flex-1 min-h-0" mode="list" :collapsed="collapsed" @new-project="handleNewProject" />
```

**Step 5: Update template — new-project-footer in project mode**

Replace the project-mode footer to show icon-only when collapsed:

```html
<div class="new-project-footer" v-else-if="mode === 'project'">
  <Button
    v-if="collapsed"
    variant="secondary"
    surface="dark"
    :icon="plus"
    tooltip="New project"
    @click="handleNewProject"
  />
  <Button
    v-else
    variant="secondary"
    surface="dark"
    label="New project"
    width="full"
    @click="handleNewProject"
  />
</div>
```

Add the `plus` icon import at the top:

```ts
import { plus } from '@wordpress/icons'
```

**Step 6: Update CSS — sidebar transitions and collapsed state**

Add/modify these rules in the `<style scoped>` block:

```css
.left-column.is-sidebar {
  width: 210px;
  transition: width var(--duration-slow) cubic-bezier(0.4, 0, 0.2, 1);
}

.left-column.is-collapsed {
  width: 45px;
}
```

Update `.frame` to use the dynamic offset:

```css
.frame {
  /* Replace the fixed left value with a transition-friendly approach */
  left: calc(210px + var(--space-xs) + var(--space-xs));
  transition: left var(--duration-slow) cubic-bezier(0.4, 0, 0.2, 1);
}
```

Add a rule for the collapsed state frame offset:

```css
.app-body:has(.is-collapsed) .frame {
  left: calc(45px + var(--space-xs) + var(--space-xs));
}
```

Update `.new-project-footer` for collapsed:

```css
.left-column.is-collapsed .new-project-footer {
  max-width: 45px;
  justify-content: center;
}
```

Wait — `.new-project-footer` is a sibling of `.left-column` content, not a child being styled via parent. Actually looking at the template, `.new-project-footer` IS inside `.left-column`. So this works. But `max-width: 210px` is set on it. In collapsed, we need `max-width: 45px` and centering. We can use `.is-collapsed .new-project-footer`:

```css
.is-collapsed .new-project-footer {
  max-width: 45px;
  justify-content: center;
}
```

**Step 7: Verify** — Run `npm run dev`. Navigate to a project. Press `Cmd+B`. The sidebar should transition from 210px to 45px. The "New project" button should show as a `+` icon. The frame should expand. Press `Cmd+B` again to expand. Refresh — collapsed state should persist.

**Step 8: Commit**

```bash
git add src/layouts/MainLayout.vue
git commit -m "feat: wire sidebar collapse into MainLayout with Cmd+B shortcut"
```

---

### Task 3: Add collapsed mode to ProjectList

**Files:**
- Modify: `src/components/features/ProjectList.vue`

This task makes ProjectList accept a `collapsed` prop and render a compact icon-only layout when collapsed.

**Step 1: Update props and imports**

```ts
import { chevronLeft, plus } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Text from '@/components/primitives/Text.vue'
import Tooltip from '@shared/primitives/Tooltip.vue'
import Button from '@/components/primitives/Button.vue'
import ProjectItem from '@/components/composites/ProjectItem.vue'
import { useProjects } from '@/data/useProjects'
import { useProjectTransition } from '@shared/data/useProjectTransition'
import { useSidebarCollapse } from '@/data/useSidebarCollapse'

const props = withDefaults(defineProps<{
  mode: 'grid' | 'list'
  collapsed?: boolean
}>(), {
  collapsed: false,
})
```

**Step 2: Update the back button for collapsed mode**

Replace the "All projects" back link with a version that handles both states:

```html
<!-- Back link (list mode only) -->
<div v-if="mode === 'list'" class="all-projects hstack" :class="{ 'is-collapsed': collapsed }" @click="goHome">
  <Tooltip :text="collapsed ? 'All projects' : undefined" placement="right">
    <WPIcon :icon="chevronLeft" :size="20" class="back-icon shrink-0" />
  </Tooltip>
  <span v-if="!collapsed" class="back-label flex-1 min-w-0">All projects</span>
  <button
    v-if="!collapsed"
    class="collapse-toggle"
    @click.stop="toggleSidebar()"
  >
    <WPIcon :icon="chevronLeft" :size="16" />
  </button>
</div>
```

Add the toggle function:

```ts
const { toggle: toggleSidebar } = useSidebarCollapse()
```

**Step 3: Pass collapsed to ProjectItem**

```html
<ProjectItem
  v-for="project in projects"
  :key="project.id"
  :project="project"
  :mode="mode === 'grid' ? 'card' : 'row'"
  :active="project.id === activeProjectId"
  :collapsed="collapsed"
  @select="selectProject"
  @toggle-status="toggleStatus"
/>
```

**Step 4: Update CSS for collapsed state**

Add these rules:

```css
.all-projects {
  gap: var(--space-xs);
  border-radius: var(--radius-s);
  cursor: pointer;
  color: var(--color-chrome-text-secondary);
  transition: background var(--transition-hover);
  position: relative;
  padding: var(--space-xxs);
}

.all-projects.is-collapsed {
  justify-content: center;
  padding: var(--space-xs) 0;
}

.collapse-toggle {
  position: absolute;
  inset-inline-end: var(--space-xxs);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--color-chrome-text-muted);
  cursor: pointer;
  border-radius: var(--radius-s);
  opacity: 0;
  transition: opacity var(--transition-hover), color var(--transition-hover), background var(--transition-hover);
}

.all-projects:hover .collapse-toggle {
  opacity: 1;
}

.collapse-toggle:hover {
  color: var(--color-chrome-text);
  background: var(--color-chrome-hover);
}

.items-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}
```

Also hide the back-label with a transition:

```css
.back-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity var(--duration-fast) var(--ease-default);
}
```

**Step 5: Verify** — Navigate to a project. Hover over "All projects" — the `«` collapse toggle should appear at the end. Click it — sidebar collapses. Back button shows just the chevron with a tooltip.

**Step 6: Commit**

```bash
git add src/components/features/ProjectList.vue
git commit -m "feat: collapsed mode for ProjectList with toggle button"
```

---

### Task 4: Add collapsed mode to ProjectItem

**Files:**
- Modify: `src/components/composites/ProjectItem.vue`

This task makes ProjectItem accept a `collapsed` prop and render favicon-only in row mode when collapsed, with a tooltip showing the project name.

**Step 1: Update props**

Add `collapsed` to the props:

```ts
const props = defineProps<{
  project: Project
  mode: 'card' | 'row'
  active?: boolean
  collapsed?: boolean
}>()
```

**Step 2: Update the template for row mode**

Wrap the entire item content in a Tooltip (only shows text when collapsed). Replace the template:

```html
<template>
  <Tooltip :text="collapsed ? project.name : undefined" placement="right">
    <div
      class="project-item"
      :class="[`mode-${mode}`, { active, collapsed }]"
      :style="mode === 'card' && project.id === transitionProjectId ? { viewTransitionName: 'project-frame' } : {}"
      @click="$emit('select', project.id)"
    >
      <div class="item-preview" v-if="mode === 'card' && previewHtml">
        <iframe
          :srcdoc="previewHtml"
          class="preview-iframe"
          tabindex="-1"
          loading="lazy"
        />
      </div>
      <div class="item-header hstack gap-xs">
        <img class="item-favicon shrink-0" :src="project.favicon" alt="" />
        <template v-if="!collapsed">
          <div class="flex-1 min-w-0">
            <div class="item-name">{{ project.name }}</div>
            <div class="item-url"><Text variant="caption" color="muted">{{ project.url }}</Text></div>
          </div>
          <Tooltip :text="project.status === 'running' ? 'Running — click to stop' : project.status === 'loading' ? 'Starting…' : 'Stopped — click to start'">
            <StatusIndicator :status="project.status" @toggle.stop="$emit('toggle-status', project.id)" />
          </Tooltip>
        </template>
      </div>
    </div>
  </Tooltip>
</template>
```

Import Tooltip:

```ts
import Tooltip from '@shared/primitives/Tooltip.vue'
```

**Step 3: Add collapsed CSS**

```css
/* Collapsed row — favicon only, centered */
.project-item.mode-row.collapsed {
  display: flex;
  justify-content: center;
  padding: var(--space-xs) 0;
}

.project-item.mode-row.collapsed .item-header {
  justify-content: center;
  gap: 0;
}

.project-item.mode-row.collapsed .item-favicon {
  width: 24px;
  height: 24px;
}

.project-item.mode-row.collapsed.active {
  background: var(--color-chrome-active);
  border-radius: var(--radius-s);
  margin-inline: var(--space-xxxs);
}
```

**Step 4: Verify** — Collapse the sidebar. Each project should show as a centered favicon. Hover → tooltip with project name. Active project has the chrome-active background pill. Click navigates.

**Step 5: Commit**

```bash
git add src/components/composites/ProjectItem.vue
git commit -m "feat: collapsed mode for ProjectItem — favicon-only with tooltip"
```

---

### Task 5: Add expand-on-click when collapsed

**Files:**
- Modify: `src/components/features/ProjectList.vue`

When the sidebar is collapsed, clicking the back chevron area should expand the sidebar (not navigate home, since there's no visible label — the intent is ambiguous). When expanded, clicking navigates home as before.

Actually — re-reading the design, the back chevron should still go home. Expanding is done via `Cmd+B` or by clicking the same collapse toggle in expanded state. When collapsed, we need a way to expand. Let's add: clicking anywhere on the collapsed back-chevron area expands the sidebar. A separate small hover-revealed expand toggle `»` appears on the collapsed rail.

Simpler: when collapsed, the back chevron area toggles expand (since you can't see "All projects" text anyway — the intent is "give me my sidebar back"). Home navigation is still available from the titlebar breadcrumb.

**Step 1: Update the back link click handler**

```html
<div v-if="mode === 'list'" class="all-projects hstack" :class="{ 'is-collapsed': collapsed }" @click="collapsed ? toggleSidebar() : goHome()">
```

**Step 2: Verify** — When collapsed, clicking the back chevron area expands the sidebar. When expanded, it navigates home.

**Step 3: Commit**

```bash
git add src/components/features/ProjectList.vue
git commit -m "feat: collapsed back button expands sidebar instead of navigating home"
```

---

### Task 6: Polish transitions and edge cases

**Files:**
- Modify: `src/layouts/MainLayout.vue`
- Modify: `src/components/features/ProjectList.vue`

**Step 1: Ensure view transitions don't conflict**

When navigating home→project while sidebar was previously collapsed, the sidebar should animate to its collapsed width from the start (not flash full-width then collapse). The `collapsed` state persists, so the CSS class is applied immediately on mount — this should just work.

Verify: Collapse sidebar → navigate home → click a project → sidebar should appear collapsed from the start.

**Step 2: Auto-expand on home navigation**

When the user is in collapsed sidebar and clicks the titlebar's home breadcrumb, the sidebar state doesn't need to change (home mode doesn't use collapse). No action needed.

**Step 3: Add the shortcut to ShortcutsModal**

Check if there's a shortcuts list and add `Cmd+B` → "Toggle sidebar":

```ts
// In whatever data structure ShortcutsModal reads from, add:
{ keys: '⌘B', label: 'Toggle sidebar' }
```

**Step 4: Verify end-to-end**

1. Open a project → sidebar expanded (210px)
2. Press `Cmd+B` → sidebar collapses to 45px with smooth animation
3. Frame expands to fill freed space
4. Collapsed shows: back chevron, favicons, "+" button
5. Hover on favicon → tooltip with project name
6. Click favicon → navigates to that project
7. Click back chevron → expands sidebar
8. Press `Cmd+B` → collapses again
9. Refresh → collapsed state persists
10. Navigate home → grid view unaffected
11. Navigate back to project → still collapsed

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish sidebar collapse transitions and add keyboard shortcut docs"
```
