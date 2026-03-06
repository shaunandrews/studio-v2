# Help System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the existing titlebar help button into a three-layer help system: dropdown menu, spotlight guided tour, and keyboard shortcuts modal.

**Architecture:** The help button becomes a FlyoutMenu dropdown (same pattern as Settings). Two new composites (SpotlightTour, ShortcutsModal) are teleported to `<body>`. A `useTour` composable manages tour state. `data-tour` attributes on target elements enable reliable spotlight targeting. Global `⌘/` shortcut opens the shortcuts modal.

**Tech Stack:** Vue 3 Composition API, existing Modal/FlyoutMenu/Button primitives, CSS clip-path for spotlight cutout, design system tokens throughout.

---

### Task 1: Keyboard Shortcuts Modal — `ShortcutsModal.vue`

The simplest new component. Uses the existing `Modal.vue` primitive.

**Files:**
- Create: `src/components/composites/ShortcutsModal.vue`

**Step 1: Create ShortcutsModal component**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { closeSmall } from '@wordpress/icons'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const isMac = navigator.platform.toUpperCase().includes('MAC')

interface Shortcut {
  label: string
  keys: string[] // each string is one key cap
}

interface ShortcutGroup {
  label: string
  shortcuts: Shortcut[]
}

const groups = computed<ShortcutGroup[]>(() => {
  const mod = isMac ? '⌘' : 'Ctrl'
  return [
    {
      label: 'Chat',
      shortcuts: [
        { label: 'Send message', keys: ['↵'] },
        { label: 'New line', keys: ['⇧', '↵'] },
        { label: 'Quick actions', keys: ['1', '–', '9'] },
        { label: 'Slash command', keys: ['/'] },
        { label: 'New chat', keys: [mod, '⇧', 'K'] },
      ],
    },
    {
      label: 'Navigation',
      shortcuts: [
        { label: 'Keyboard shortcuts', keys: [mod, '/'] },
      ],
    },
  ]
})
</script>

<template>
  <Modal :open="open" width="420px" @close="emit('close')">
    <div class="shortcuts-modal vstack">
      <div class="shortcuts-header hstack justify-between align-center px-m pt-m pb-xs">
        <span class="shortcuts-title">Keyboard Shortcuts</span>
        <Button variant="tertiary" :icon="closeSmall" size="small" @click="emit('close')" />
      </div>
      <div class="shortcuts-body vstack gap-m px-m pb-m">
        <div v-for="group in groups" :key="group.label" class="shortcut-group vstack gap-xxs">
          <span class="shortcut-group-label">{{ group.label }}</span>
          <div
            v-for="shortcut in group.shortcuts"
            :key="shortcut.label"
            class="shortcut-row hstack justify-between align-center"
          >
            <span class="shortcut-label">{{ shortcut.label }}</span>
            <span class="shortcut-keys hstack gap-xxxs">
              <kbd v-for="(key, ki) in shortcut.keys" :key="ki">{{ key }}</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.shortcuts-title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.shortcut-group-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding-block-end: var(--space-xxxs);
  border-block-end: 1px solid var(--color-surface-border);
}

.shortcut-row {
  padding: var(--space-xxs) 0;
}

.shortcut-label {
  font-size: var(--font-size-s);
  color: var(--color-text-secondary);
}

.shortcut-keys {
  flex-shrink: 0;
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--space-xxs);
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-s);
}
</style>
```

**Step 2: Verify it renders**

Temporarily import and mount in `MainLayout.vue` with `:open="true"` to visually confirm, then revert.

**Step 3: Commit**

```bash
git add src/components/composites/ShortcutsModal.vue
git commit -m "feat: add ShortcutsModal component for keyboard shortcuts reference"
```

---

### Task 2: Wire Help Dropdown in Titlebar

Replace the static help `<Button>` with a `FlyoutMenu` dropdown. Wire "Keyboard Shortcuts" to open the modal, "Take a Tour" as a placeholder emit, and external links to `window.open`.

**Files:**
- Modify: `src/components/primitives/Titlebar.vue` (lines 231-255 template, plus script imports)

**Step 1: Add help menu state and handlers to Titlebar script**

After the existing settings imports and state, add:

```typescript
import { external as externalIcon } from '@wordpress/icons'

const emit = defineEmits<{
  'open-shortcuts': []
  'start-tour': []
}>()

const helpMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      { label: 'Take a Tour', action: () => emit('start-tour') },
      { label: 'Keyboard Shortcuts', detail: '⌘/', action: () => emit('open-shortcuts') },
    ],
  },
  {
    items: [
      { label: 'Help', icon: externalIcon, action: () => window.open('https://developer.wordpress.org/studio/', '_blank') },
      { label: 'Community', icon: externalIcon, action: () => window.open('https://wordpress.org/support/forum/', '_blank') },
      { label: 'Report a Bug', icon: externalIcon, action: () => window.open('https://github.com/nicepkg/studio/issues', '_blank') },
    ],
  },
])
```

**Step 2: Replace help Button with FlyoutMenu in template**

In the template `titlebar-end` section, replace:
```html
<Button variant="tertiary" surface="dark" :icon="help" size="small" tooltip="Help" />
```

With:
```html
<FlyoutMenu :groups="helpMenuGroups" surface="dark" align="end">
  <template #trigger="{ toggle, open: menuOpen }">
    <Button variant="tertiary" surface="dark" :icon="help" size="small"
      :tooltip="menuOpen ? undefined : 'Help'" @click="toggle" />
  </template>
</FlyoutMenu>
```

**Step 3: Commit**

```bash
git add src/components/primitives/Titlebar.vue
git commit -m "feat: wire help button as dropdown menu with tour, shortcuts, and support links"
```

---

### Task 3: Mount ShortcutsModal in MainLayout + Global ⌘/ Shortcut

Wire the shortcuts modal at the app layout level so it's always accessible. Add global `⌘/` keyboard shortcut.

**Files:**
- Modify: `src/layouts/MainLayout.vue` (script + template)

**Step 1: Add shortcuts modal state and keyboard handler**

In `MainLayout.vue` script, add:

```typescript
import ShortcutsModal from '@/components/composites/ShortcutsModal.vue'
import { onMounted, onBeforeUnmount } from 'vue'

const showShortcuts = ref(false)

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    showShortcuts.value = !showShortcuts.value
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})
```

**Step 2: Pass Titlebar events and mount modal in template**

Update the `<Titlebar />` tag:
```html
<Titlebar @open-shortcuts="showShortcuts = true" @start-tour="startTour" />
```

Add the modal at the end of the `main-layout` div:
```html
<ShortcutsModal :open="showShortcuts" @close="showShortcuts = false" />
```

The `startTour` function is a placeholder for now — add it as an empty function:
```typescript
function startTour() {
  // Will be wired in Task 5
}
```

**Step 3: Test ⌘/ shortcut**

Run `npm run dev`, press ⌘/ — modal should open and close. Click help dropdown → Keyboard Shortcuts → modal opens.

**Step 4: Commit**

```bash
git add src/layouts/MainLayout.vue
git commit -m "feat: mount ShortcutsModal in MainLayout with global ⌘/ shortcut"
```

---

### Task 4: Tour Composable — `useTour.ts`

Manages tour state: step definitions, current step index, navigation, element targeting.

**Files:**
- Create: `src/data/useTour.ts`

**Step 1: Create the composable**

```typescript
import { ref, computed, onBeforeUnmount, watch } from 'vue'

export interface TourStep {
  id: string
  selector: string           // CSS selector or [data-tour="..."]
  title: string
  description: string
}

const STEPS: TourStep[] = [
  {
    id: 'sidebar',
    selector: '[data-tour="sidebar"]',
    title: 'Your projects',
    description: 'Your projects live here. Click to switch between them.',
  },
  {
    id: 'chat',
    selector: '[data-tour="chat"]',
    title: 'Chat with Kit',
    description: 'Chat with Kit to build and customize your site. Ask anything.',
  },
  {
    id: 'input',
    selector: '[data-tour="input"]',
    title: 'Type or tap',
    description: 'Type here or use the numbered shortcuts. Kit suggests actions as you go.',
  },
  {
    id: 'preview',
    selector: '[data-tour="preview"]',
    title: 'Live preview',
    description: 'Live preview of your site. Changes appear here in real time.',
  },
  {
    id: 'skills',
    selector: '[data-tour="skills"]',
    title: 'Skills',
    description: 'Enable skills to give Kit new abilities — SEO, security, design, and more.',
  },
  {
    id: 'model',
    selector: '[data-tour="model"]',
    title: 'AI model',
    description: 'Choose which AI model powers Kit. Different models, different strengths.',
  },
]

// Singleton state
const active = ref(false)
const currentIndex = ref(0)
const targetRect = ref<DOMRect | null>(null)

let resizeObserver: ResizeObserver | null = null
let targetEl: Element | null = null

function updateTargetRect() {
  if (!targetEl) {
    targetRect.value = null
    return
  }
  targetRect.value = targetEl.getBoundingClientRect()
}

function observeTarget(el: Element | null) {
  // Clean up previous
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  targetEl = el
  if (!el) {
    targetRect.value = null
    return
  }
  updateTargetRect()
  resizeObserver = new ResizeObserver(updateTargetRect)
  resizeObserver.observe(el)
}

function resolveStep() {
  const step = STEPS[currentIndex.value]
  if (!step) return
  const el = document.querySelector(step.selector)
  observeTarget(el)
}

export function useTour() {
  const currentStep = computed(() => STEPS[currentIndex.value] ?? null)
  const totalSteps = STEPS.length
  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === STEPS.length - 1)

  function start() {
    currentIndex.value = 0
    active.value = true
    resolveStep()
    window.addEventListener('scroll', updateTargetRect, true)
    window.addEventListener('resize', updateTargetRect)
  }

  function stop() {
    active.value = false
    observeTarget(null)
    window.removeEventListener('scroll', updateTargetRect, true)
    window.removeEventListener('resize', updateTargetRect)
  }

  function next() {
    if (currentIndex.value < STEPS.length - 1) {
      currentIndex.value++
      resolveStep()
    } else {
      stop()
    }
  }

  function back() {
    if (currentIndex.value > 0) {
      currentIndex.value--
      resolveStep()
    }
  }

  return {
    active,
    currentStep,
    currentIndex,
    totalSteps,
    targetRect,
    isFirst,
    isLast,
    start,
    stop,
    next,
    back,
  }
}
```

**Step 2: Commit**

```bash
git add src/data/useTour.ts
git commit -m "feat: add useTour composable for spotlight tour state management"
```

---

### Task 5: Spotlight Tour Component — `SpotlightTour.vue`

The overlay with cutout, tooltip card, and step controls. Teleported to `<body>`.

**Files:**
- Create: `src/components/composites/SpotlightTour.vue`

**Step 1: Create SpotlightTour component**

```vue
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import Button from '@/components/primitives/Button.vue'
import { useTour } from '@/data/useTour'

const { active, currentStep, currentIndex, totalSteps, targetRect, isFirst, isLast, next, back, stop } = useTour()

// Padding around the target element
const PAD = 8

// Clip-path that punches a rounded rectangle hole in the overlay
const clipPath = computed(() => {
  if (!targetRect.value) return 'none'
  const r = targetRect.value
  const x = r.left - PAD
  const y = r.top - PAD
  const w = r.width + PAD * 2
  const h = r.height + PAD * 2
  const radius = 8 // --radius-m equivalent

  // SVG-based approach: use an inset() with round
  // clip-path: inset() only cuts inward, so we can't use it for a "hole"
  // Instead, we'll use a polygon with a counter-clockwise inner rect
  // For rounded corners, we'll skip clip-path and use a mask or box-shadow approach

  // Simplest high-quality approach: massive box-shadow on a positioned element
  return { x, y, w, h, radius }
})

// Tooltip position: prefer below the target, fall back to above
const tooltipStyle = computed(() => {
  if (!targetRect.value) return {}
  const r = targetRect.value
  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '10001',
    width: '320px',
  }

  const spaceBelow = window.innerHeight - (r.bottom + PAD)
  const spaceAbove = r.top - PAD

  if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
    // Below
    style.top = `${r.bottom + PAD + 12}px`
  } else {
    // Above
    style.bottom = `${window.innerHeight - r.top + PAD + 12}px`
  }

  // Horizontal: center on target, clamp to viewport
  let left = r.left + r.width / 2 - 160 // 160 = half of 320px width
  if (left + 320 > window.innerWidth - 16) left = window.innerWidth - 16 - 320
  if (left < 16) left = 16
  style.left = `${left}px`

  return style
})

function onKeydown(e: KeyboardEvent) {
  if (!active.value) return
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    back()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    stop()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tour">
      <div v-if="active && targetRect" class="tour-overlay" @click.self="stop">
        <!-- Cutout highlight -->
        <div
          class="tour-cutout"
          :style="{
            top: clipPath.y + 'px',
            left: clipPath.x + 'px',
            width: clipPath.w + 'px',
            height: clipPath.h + 'px',
            borderRadius: clipPath.radius + 'px',
          }"
        />

        <!-- Tooltip card -->
        <div class="tour-tooltip vstack gap-xs" :style="tooltipStyle">
          <div class="tour-tooltip__title">{{ currentStep?.title }}</div>
          <div class="tour-tooltip__desc">{{ currentStep?.description }}</div>
          <div class="tour-tooltip__footer hstack justify-between align-center">
            <span class="tour-tooltip__step">{{ currentIndex + 1 }} of {{ totalSteps }}</span>
            <div class="hstack gap-xxs">
              <Button v-if="!isFirst" variant="tertiary" label="Back" size="small" @click="back" />
              <Button variant="primary" :label="isLast ? 'Done' : 'Next'" size="small" @click="next" />
            </div>
          </div>
          <button class="tour-skip" @click="stop">Skip tour</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  /* Semi-transparent backdrop via box-shadow on the cutout */
  background: rgba(0, 0, 0, 0.6);
}

.tour-cutout {
  position: fixed;
  z-index: 10000;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  background: transparent;
  pointer-events: none;
  transition: top var(--duration-slow) var(--ease-in-out),
    left var(--duration-slow) var(--ease-in-out),
    width var(--duration-slow) var(--ease-in-out),
    height var(--duration-slow) var(--ease-in-out);
}

.tour-overlay {
  /* Override: make overlay transparent — the cutout's box-shadow IS the overlay */
  background: transparent;
}

.tour-tooltip {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-m);
  padding: var(--space-m);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: top var(--duration-slow) var(--ease-in-out),
    left var(--duration-slow) var(--ease-in-out),
    bottom var(--duration-slow) var(--ease-in-out);
}

.tour-tooltip__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.tour-tooltip__desc {
  font-size: var(--font-size-s);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.tour-tooltip__footer {
  padding-block-start: var(--space-xxs);
}

.tour-tooltip__step {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tour-skip {
  background: none;
  border: none;
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  text-align: center;
  transition: color var(--duration-fast) var(--ease-default);
}

.tour-skip:hover {
  color: var(--color-text-secondary);
}

/* Transition */
.tour-enter-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.tour-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.tour-enter-from,
.tour-leave-to {
  opacity: 0;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/composites/SpotlightTour.vue
git commit -m "feat: add SpotlightTour component with cutout overlay and tooltip"
```

---

### Task 6: Add `data-tour` Attributes to Target Elements

Add `data-tour` attributes so the tour can find its targets.

**Files:**
- Modify: `src/layouts/MainLayout.vue` — sidebar container
- Modify: `src/components/features/AgentPanel.vue` — chat area and input
- Modify: `src/components/features/SitePreview.vue` — preview container
- Modify: `src/components/composites/InputChat.vue` — model selector and skills dropdown

**Step 1: Add `data-tour="sidebar"` to MainLayout's left column**

In `MainLayout.vue`, on the `.left-column` div, add `data-tour="sidebar"`:

```html
<div
  class="left-column vstack"
  :class="{ 'is-sidebar': mode === 'project' }"
  :style="{ viewTransitionName: mode === 'project' ? 'sidebar' : 'project-grid' }"
  data-tour="sidebar"
>
```

**Step 2: Add `data-tour="chat"` and `data-tour="input"` to AgentPanel**

In `AgentPanel.vue` template:

On the `ChatMessageList` component:
```html
<div data-tour="chat">
  <ChatMessageList :messages="msgs" :project-id="projectId" />
</div>
```

Actually, wrapping adds unnecessary DOM. Better: add the attribute directly to the agent-panel input area div that already exists:

On the `.agent-panel__input` div (line 402):
```html
<div class="agent-panel__input shrink-0 px-s pb-s" data-tour="input">
```

For chat, the `ChatMessageList` component (line 400) — we can't add data attributes to components directly in Vue without them falling through. Instead, wrap it or add the attribute inside `ChatMessageList`. The simplest: add a wrapper div.

Change line 400 from:
```html
<ChatMessageList :messages="msgs" :project-id="projectId" />
```
To:
```html
<ChatMessageList :messages="msgs" :project-id="projectId" data-tour="chat" />
```

This works if `ChatMessageList` has a single root element — Vue 3 will pass through the attribute automatically (attribute fallthrough). Check that `ChatMessageList` has a single root. If it does, the attribute lands on the root element. If not, we'll wrap it.

**Step 3: Add `data-tour="preview"` to SitePreview**

In `SitePreview.vue`, the root element is `.site-preview`. Add the attribute:

```html
<div class="site-preview vstack flex-1 overflow-hidden" data-tour="preview">
```

**Step 4: Add `data-tour="model"` and `data-tour="skills"` to InputChat**

In `InputChat.vue`, on the model `Dropdown` (line 296):
```html
<div data-tour="model">
  <Dropdown v-model="selectedModel" :groups="models" placement="above" :surface="props.surface" tooltip="Model" />
</div>
```

On the skills `Dropdown` (lines 297-305):
```html
<div v-if="projectId && skillDropdownGroups.length" data-tour="skills">
  <Dropdown ... />
</div>
```

**Step 5: Commit**

```bash
git add src/layouts/MainLayout.vue src/components/features/AgentPanel.vue src/components/features/SitePreview.vue src/components/composites/InputChat.vue
git commit -m "feat: add data-tour attributes for spotlight tour targeting"
```

---

### Task 7: Mount SpotlightTour in MainLayout + Wire Tour Start

Connect everything: mount the SpotlightTour, wire Titlebar's `start-tour` event, handle the "need a project open" prerequisite.

**Files:**
- Modify: `src/layouts/MainLayout.vue`

**Step 1: Import and mount SpotlightTour**

Add imports:
```typescript
import SpotlightTour from '@/components/composites/SpotlightTour.vue'
import { useTour } from '@/data/useTour'

const { start: startTourFn, active: tourActive } = useTour()
```

Replace the placeholder `startTour` function:
```typescript
function startTour() {
  if (mode.value === 'home') {
    // Need a project open — navigate to the first seed project
    const firstProject = projects.value[0]
    if (firstProject) {
      navigateToProject(firstProject.id).then(() => {
        // Wait for DOM to settle after navigation
        setTimeout(() => startTourFn(), 400)
      })
    }
    return
  }
  startTourFn()
}
```

Add `SpotlightTour` to the template, after `ShortcutsModal`:
```html
<SpotlightTour />
```

**Step 2: Add `projects` import**

Ensure `projects` from `useProjects()` is destructured (it already is — `const { createUntitledProject } = useProjects()` just needs `projects` added):
```typescript
const { createUntitledProject, projects } = useProjects()
```

Wait — `projects` is already imported (referenced in the existing code via `useProjects`). Check the destructuring. If not, add it.

**Step 3: Test the full flow**

Run `npm run dev`:
1. Click help button → dropdown appears with 5 items
2. Click "Keyboard Shortcuts" → modal opens, ⌘/ also works
3. Click "Take a Tour" → if on home, navigates to first project, then tour starts
4. Tour steps through 6 elements with spotlight cutouts
5. Arrow keys, Escape, Back/Next/Done all work
6. External links open in new tabs

**Step 4: Commit**

```bash
git add src/layouts/MainLayout.vue
git commit -m "feat: mount SpotlightTour and wire help dropdown tour trigger"
```

---

### Task 8: Polish and Edge Cases

Final polish pass.

**Files:**
- Modify: `src/components/composites/SpotlightTour.vue` (if needed)
- Modify: `src/data/useTour.ts` (if needed)

**Step 1: Handle missing target elements**

In `useTour.ts`, if `document.querySelector` returns null for a step (element not rendered), skip to the next step that has a visible target. Add:

```typescript
function resolveStep() {
  const step = STEPS[currentIndex.value]
  if (!step) return
  const el = document.querySelector(step.selector)
  if (!el) {
    // Element not visible — skip this step
    if (currentIndex.value < STEPS.length - 1) {
      currentIndex.value++
      resolveStep()
    } else {
      stop()
    }
    return
  }
  observeTarget(el)
}
```

**Step 2: Ensure preview panel is visible for tour step 4**

The site preview might be hidden when the tour starts. The tour should ensure it's visible. In `MainLayout.vue`'s `startTour`, before starting:

```typescript
import { usePreviewState } from '@/data/usePreviewState'
const { setVisible } = usePreviewState()

function startTour() {
  // ... existing project navigation logic ...
  // Ensure preview is visible for tour
  if (mode.value === 'project' && route.params.id) {
    setVisible(route.params.id as string, true)
  }
  startTourFn()
}
```

**Step 3: Commit**

```bash
git add src/components/composites/SpotlightTour.vue src/data/useTour.ts src/layouts/MainLayout.vue
git commit -m "fix: handle missing tour targets and ensure preview visibility"
```

---

### Task 9: Final Verification

**Step 1: Full walkthrough test**

1. From home view: Help → Take a Tour → auto-navigates to project → tour plays
2. From project view: Help → Take a Tour → tour plays immediately
3. Help → Keyboard Shortcuts → modal opens
4. ⌘/ → modal toggles
5. Help → Help/Community/Report a Bug → external tabs open
6. Tour: Back/Next/Done/Skip/Escape/Arrow keys all work
7. Tour: cutout transitions smoothly between steps
8. Dark mode: everything renders correctly
9. Resize during tour: cutout tracks element position

**Step 2: Commit any final fixes**

```bash
git add -u
git commit -m "feat: complete help system — dropdown, spotlight tour, shortcuts modal"
```
