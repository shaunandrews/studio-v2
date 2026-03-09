# Preferences Window Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild PreferencesModal to look like a separate OS window with traffic lights, horizontal tabs, fixed 480px width, variable height, and pinned to top of viewport.

**Architecture:** Rewrite PreferencesModal.vue in-place. Remove sidebar nav (PrefsNavItem no longer needed). Add Account tab. Redesign Agents/Skills from grid/cards to list rows. Remove footer. Remove skill viewer panel.

**Tech Stack:** Vue 3, existing design tokens, existing primitives (Button, Text, Dropdown, Toggle, WPIcon, Modal)

---

### Task 1: Window chrome + horizontal tabs + positioning

Replace sidebar nav with window chrome header (traffic lights + centered title) and horizontal tab bar. Pin modal to top. Remove footer.

**Files:**
- Modify: `src/components/composites/PreferencesModal.vue`

**Step 1: Update template structure**

Replace the current `<Modal>` wrapper + sidebar nav + footer with a custom window panel. The Modal component centers vertically — we need top-pinning, so we'll build our own scrim/panel instead.

Template should become:

```html
<Teleport to="body">
  <Transition name="modal">
    <div v-if="open" class="prefs-scrim" @click.self="emit('close')">
      <div class="prefs-window">
        <!-- Window chrome -->
        <div class="prefs-chrome">
          <div class="prefs-traffic-lights">
            <button class="prefs-traffic-dot prefs-traffic-dot--close" @click="emit('close')" />
            <span class="prefs-traffic-dot prefs-traffic-dot--minimize" />
            <span class="prefs-traffic-dot prefs-traffic-dot--maximize" />
          </div>
          <Text variant="caption" weight="semibold" class="prefs-title">Studio Preferences</Text>
        </div>

        <!-- Tabs -->
        <nav class="prefs-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="prefs-tab"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- Content (scrollable, variable height) -->
        <div class="prefs-content">
          <!-- tab panels go here -->
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

**Step 2: Update tab type to include 'account'**

```ts
type Tab = 'general' | 'agents' | 'skills' | 'account'

const tabs: { id: Tab, label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'agents', label: 'Agents' },
  { id: 'skills', label: 'Skills' },
  { id: 'account', label: 'Account' },
]
```

**Step 3: Write window + tabs CSS**

```css
/* No longer using Modal, so remove the global override style block */

.prefs-scrim {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  /* Physical: pinned to top of app window */
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  background: rgba(0, 0, 0, 0.35);
}

.prefs-window {
  width: 480px;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-m);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
}

.prefs-chrome {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  flex-shrink: 0;
}

.prefs-traffic-lights {
  position: absolute;
  /* Physical: app chrome edge */
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: var(--space-xxs);
}

.prefs-traffic-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: default;
}

.prefs-traffic-dot--close {
  background: var(--color-macos-close);
  cursor: pointer;
}

.prefs-traffic-dot--minimize {
  background: var(--color-macos-minimize);
}

.prefs-traffic-dot--maximize {
  background: var(--color-macos-maximize);
}

.prefs-title {
  user-select: none;
}

.prefs-tabs {
  display: flex;
  gap: var(--space-xl);
  justify-content: center;
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.prefs-tab {
  padding: var(--space-xs) 0;
  border: none;
  border-block-end: 2px solid transparent;
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  cursor: pointer;
  transition: color var(--duration-instant) var(--ease-default);
}

.prefs-tab:hover {
  color: var(--color-frame-fg);
}

.prefs-tab.is-active {
  color: var(--color-frame-fg);
  border-block-end-color: var(--color-frame-fg);
}

.prefs-content {
  overflow-y: auto;
  padding: var(--space-m) var(--space-xl) var(--space-xl);
}
```

**Step 4: Remove Modal import, footer template, PrefsNavItem import, and the global style block**

Remove these imports:
- `import Modal from '@/components/primitives/Modal.vue'`
- `import PrefsNavItem from '@/components/composites/PrefsNavItem.vue'`

Remove the `<template #footer>` block and the global `<style>` block that overrides `.modal-content`.

**Step 5: Add Escape key handler**

Since we're no longer using Modal (which had its own Escape handler), add one:

```ts
import { onMounted, onBeforeUnmount } from 'vue'

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
```

**Step 6: Keep existing transition classes**

Reuse the `modal-enter-active`, `modal-leave-active` etc transition CSS from Modal.vue — copy the relevant keyframes and transition styles into the scoped style block, adapted for `.prefs-window` instead of `.modal-panel`.

**Step 7: Commit**

```
feat: preferences window chrome, horizontal tabs, top-pinned layout
```

---

### Task 2: Redesign Agents tab — list layout

Replace the hero card + grid layout with a flat list matching the design: description text at top, Installed section with list rows (icon + name + description + three-dot menu), Available section with "Install all" link and Install buttons.

**Files:**
- Modify: `src/components/composites/PreferencesModal.vue`

**Step 1: Update Agents template**

Replace the entire `activeTab === 'agents'` template block:

```html
<template v-if="activeTab === 'agents'">
  <Text variant="caption" color="muted" class="prefs-description">
    Agents are AI-powered assistants that can perform actions and accomplish tasks for you.
  </Text>

  <!-- Installed -->
  <div class="prefs-section">
    <Text variant="small" weight="semibold" color="muted" class="prefs-section-label">INSTALLED</Text>
    <div class="prefs-list">
      <div
        v-for="agent in installedAgents"
        :key="agent.id"
        class="prefs-list-item"
      >
        <img :src="agent.icon" :alt="agent.label" class="prefs-list-icon" />
        <div class="prefs-list-info">
          <Text variant="caption" weight="semibold">{{ agent.label }}</Text>
          <Text variant="small" color="muted">{{ agent.description }}</Text>
        </div>
        <button class="prefs-list-menu">⋮</button>
      </div>
    </div>
  </div>

  <!-- Available -->
  <div v-if="availableAgents.length" class="prefs-section">
    <div class="prefs-section-header">
      <Text variant="small" weight="semibold" color="muted">AVAILABLE</Text>
      <button class="prefs-install-all">Install all</button>
    </div>
    <div class="prefs-list">
      <div
        v-for="agent in availableAgents"
        :key="agent.id"
        class="prefs-list-item"
      >
        <img :src="agent.icon" :alt="agent.label" class="prefs-list-icon" />
        <div class="prefs-list-info">
          <Text variant="caption" weight="semibold">{{ agent.label }}</Text>
          <Text variant="small" color="muted">{{ agent.description }}</Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          :label="installLabel(agent.id)"
          :disabled="getInstallState(agent.id) !== 'idle'"
          @click="startInstall(agent.id)"
        />
      </div>
    </div>
  </div>

  <!-- Default agent -->
  <div class="prefs-section">
    <Text variant="caption" weight="semibold" class="prefs-field-label">Default agent</Text>
    <Dropdown ... />
    <Text variant="small" color="muted" class="prefs-hint">This is the agent that will be used for all new tasks.</Text>
  </div>
</template>
```

**Step 2: Add computed properties for installed/available agents**

```ts
const installedAgents = computed(() => codingAgents.filter(a => a.installed || getInstallState(a.id) === 'done'))
const availableAgents = computed(() => codingAgents.filter(a => !a.installed && getInstallState(a.id) !== 'done'))
```

**Step 3: Write shared list CSS**

These styles are shared between Agents and Skills tabs:

```css
.prefs-description {
  display: block;
  text-align: center;
  margin-block-end: var(--space-m);
  line-height: 1.5;
}

.prefs-section {
  margin-block-start: var(--space-m);
}

.prefs-section:first-child {
  margin-block-start: 0;
}

.prefs-section-label {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-block-end: var(--space-xs);
}

.prefs-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-xs);
}

.prefs-list {
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: hidden;
}

.prefs-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s);
}

.prefs-list-item + .prefs-list-item {
  border-block-start: 1px solid var(--color-frame-border);
}

.prefs-list-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  object-fit: contain;
}

.prefs-list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.prefs-list-menu {
  padding: var(--space-xxs);
  border: none;
  background: none;
  color: var(--color-frame-fg-muted);
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--radius-s);
}

.prefs-list-menu:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.prefs-install-all {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-s);
  cursor: pointer;
}

.prefs-install-all:hover {
  text-decoration: underline;
}
```

**Step 4: Remove old agent CSS**

Delete all `.prefs__agent-hero*`, `.prefs__agent-grid`, `.prefs__agent-card*` styles.

**Step 5: Commit**

```
feat: redesign agents tab to list layout
```

---

### Task 3: Redesign Skills tab — list layout, remove viewer panel

Same list pattern as agents. Remove the skill viewer side panel (no wider view). Remove `viewingSkill` / `skillContent` / `viewSkill()` logic.

**Files:**
- Modify: `src/components/composites/PreferencesModal.vue`

**Step 1: Update Skills template**

```html
<template v-if="activeTab === 'skills'">
  <Text variant="caption" color="muted" class="prefs-description">
    Agents can decide to use skills to help them accomplish specialized tasks.
  </Text>

  <!-- Installed -->
  <div class="prefs-section">
    <Text variant="small" weight="semibold" color="muted" class="prefs-section-label">INSTALLED</Text>
    <div v-if="installedSkills.length" class="prefs-list">
      <div v-for="skill in installedSkills" :key="skill.id" class="prefs-list-item">
        <div class="prefs-list-info">
          <Text variant="caption" weight="semibold">{{ skill.name }}</Text>
          <Text variant="small" color="muted">{{ skill.description }}</Text>
        </div>
        <button class="prefs-list-menu">⋮</button>
      </div>
    </div>
  </div>

  <!-- Available -->
  <div v-if="availableSkills.length" class="prefs-section">
    <div class="prefs-section-header">
      <Text variant="small" weight="semibold" color="muted">AVAILABLE</Text>
      <button class="prefs-install-all" :disabled="installingAll" @click="startInstallAll">
        {{ installingAll ? 'Installing…' : 'Install all' }}
      </button>
    </div>
    <div class="prefs-list">
      <div v-for="skill in availableSkills" :key="skill.id" class="prefs-list-item">
        <div class="prefs-list-info">
          <Text variant="caption" weight="semibold">{{ skill.name }}</Text>
          <Text variant="small" color="muted" class="prefs-list-desc-truncate">{{ skill.description }}</Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          :label="skillInstallLabel(skill.id)"
          :disabled="getSkillInstallState(skill.id) !== 'idle' || installingAll"
          @click="startSkillInstall(skill.id)"
        />
      </div>
    </div>
  </div>
</template>
```

**Step 2: Remove viewer panel logic**

Delete: `viewingSkill`, `skillContent`, `skillContentLoading`, `viewSkill()`, `fetchSkillContent` import. Remove the `viewingSkill ? '1080px' : '780px'` width logic (no longer relevant). Remove the skill panel template block. Remove `MarkdownText` import.

**Step 3: Add truncation CSS for skill descriptions**

```css
.prefs-list-desc-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Step 4: Remove old skills CSS**

Delete all `.prefs__skill-*` and `.prefs__skill-panel*` styles.

**Step 5: Commit**

```
feat: redesign skills tab, remove viewer panel
```

---

### Task 4: Clean up General tab styles

Migrate the General tab content to use the new class naming (no double-underscore BEM, consistent with new pattern). Keep all existing functionality.

**Files:**
- Modify: `src/components/composites/PreferencesModal.vue`

**Step 1: Rename CSS classes in General tab template**

Update class names from `prefs__*` to `prefs-*` pattern for consistency. The content stays the same — appearance picker, language, code editor, terminal, CLI toggle, API key, data reset.

**Step 2: Update CSS to match**

Rename all `.prefs__appearance*`, `.prefs__hstack`, `.prefs__field`, `.prefs__toggle*`, `.prefs__dropdown-full`, `.prefs__key-row`, `.prefs__input`, `.prefs__data-row`, `.prefs__learn-more` to `.prefs-*` equivalents.

**Step 3: Remove agent instruction files section**

The design doesn't show instruction files in any tab. Remove the `instructionFiles` data and its template block from the agents tab (already handled in Task 2, but verify).

**Step 4: Commit**

```
refactor: normalize general tab class names
```

---

### Task 5: Add Account tab

New tab with avatar, name, email, and Log out button.

**Files:**
- Modify: `src/components/composites/PreferencesModal.vue`

**Step 1: Add Account template**

```html
<template v-if="activeTab === 'account'">
  <div class="prefs-account">
    <img
      src="https://2.gravatar.com/avatar/?s=80"
      alt=""
      class="prefs-account-avatar"
    />
    <div class="prefs-account-info">
      <Text variant="body" weight="semibold">Shaun Andrews</Text>
      <Text variant="caption" color="muted">shaun@automattic.com</Text>
    </div>
    <Button variant="secondary" size="small" label="Log out" />
  </div>
</template>
```

**Step 2: Write Account CSS**

```css
.prefs-account {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.prefs-account-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.prefs-account-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}
```

**Step 3: Commit**

```
feat: add account tab to preferences
```

---

### Task 6: Final cleanup

Remove dead code and unused component.

**Files:**
- Modify: `src/components/composites/PreferencesModal.vue`
- Possibly delete: `src/components/composites/PrefsNavItem.vue` (if no other consumers)

**Step 1: Verify PrefsNavItem has no other consumers**

Search for imports of PrefsNavItem. If only used in PreferencesModal, delete it.

**Step 2: Remove any remaining old CSS**

Scan for any `.prefs__*` (double-underscore) styles that survived the migration. Delete them.

**Step 3: Remove unused imports**

Check for any imports no longer referenced (Modal, PrefsNavItem, MarkdownText, fetchSkillContent, file icon, etc).

**Step 4: Verify in browser**

Run `npm run dev`, open preferences, check all 4 tabs render correctly.

**Step 5: Commit**

```
chore: remove dead code from preferences redesign
```
