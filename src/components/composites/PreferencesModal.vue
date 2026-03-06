<script setup lang="ts">
import { ref, watch } from 'vue'
import { file as fileIcon, check } from '@wordpress/icons'
import Modal from '@shared/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import WPIcon from '@shared/primitives/WPIcon.vue'
import { getAPIKey, setAPIKey, isAIConfigured } from '@/data/ai-service'
import { codingAgents } from '@/data/agents'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// -- Nav --

type Tab = 'general' | 'agents' | 'skills' | 'account'
const activeTab = ref<Tab>('general')

const tabs: { id: Tab, label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'agents', label: 'Agents' },
  { id: 'skills', label: 'Skills' },
  { id: 'account', label: 'Account' },
]

// -- Appearance --

type AppearanceMode = 'system' | 'light' | 'dark'
const APPEARANCE_KEY = 'appearance-mode'

function getStoredAppearance(): AppearanceMode {
  return (localStorage.getItem(APPEARANCE_KEY) as AppearanceMode) || 'system'
}

function applyAppearance(mode: AppearanceMode) {
  const root = document.documentElement
  if (mode === 'system') {
    root.removeAttribute('data-color-scheme')
  } else {
    root.setAttribute('data-color-scheme', mode)
  }
}

const appearance = ref<AppearanceMode>(getStoredAppearance())

function setAppearance(mode: AppearanceMode) {
  appearance.value = mode
  localStorage.setItem(APPEARANCE_KEY, mode)
  applyAppearance(mode)
}

// Apply on load
applyAppearance(appearance.value)

// -- API Key --

const apiKey = ref('')
const keySaved = ref(false)
const keyConfigured = ref(isAIConfigured())

watch(() => props.open, (val) => {
  if (val) {
    apiKey.value = getAPIKey()
    keySaved.value = false
  }
})

function saveKey() {
  setAPIKey(apiKey.value)
  keyConfigured.value = isAIConfigured()
  keySaved.value = true
  setTimeout(() => { keySaved.value = false }, 1500)
}

function clearKey() {
  apiKey.value = ''
  setAPIKey('')
  keyConfigured.value = false
}

// -- Default AI model --

const MODEL_KEY = 'ai-default-model'
const defaultModel = ref(localStorage.getItem(MODEL_KEY) || 'claude-sonnet-4-6')

function setModel(model: string) {
  defaultModel.value = model
  localStorage.setItem(MODEL_KEY, model)
}

// -- Default Agent --

const AGENT_KEY = 'default-agent'
const defaultAgent = ref(localStorage.getItem(AGENT_KEY) || 'claude-code')

function setAgent(agentId: string) {
  defaultAgent.value = agentId
  localStorage.setItem(AGENT_KEY, agentId)
}

// -- Agent instructions --

const instructionFiles = [
  { name: 'AGENTS.md', description: 'Agent behavior, tools, and integration rules' },
  { name: 'CLAUDE.md', description: 'Project context and coding conventions' },
]
</script>

<template>
  <Modal :open="open" width="640px" @close="emit('close')">
    <div class="prefs">
      <div class="prefs__header">
        <h2 class="prefs__title">Preferences</h2>
        <button class="prefs__close" @click="emit('close')">&times;</button>
      </div>

      <div class="prefs__body">
        <!-- Nav -->
        <nav class="prefs__nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="prefs__nav-item"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- Content -->
        <div class="prefs__content">

          <!-- ═══ General ═══ -->
          <template v-if="activeTab === 'general'">
            <div class="prefs__section">
              <label class="prefs__label">Appearance</label>
              <div class="prefs__appearance">
                <button
                  v-for="mode in (['system', 'light', 'dark'] as const)"
                  :key="mode"
                  class="prefs__appearance-btn"
                  :class="{ 'is-active': appearance === mode }"
                  @click="setAppearance(mode)"
                >
                  <div class="prefs__appearance-preview" :class="`preview--${mode}`">
                    <div class="preview__bar" />
                    <div class="preview__body">
                      <div class="preview__sidebar" />
                      <div class="preview__content">
                        <div class="preview__line" />
                        <div class="preview__line preview__line--short" />
                      </div>
                    </div>
                  </div>
                  <span class="prefs__appearance-name">{{ mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark' }}</span>
                </button>
              </div>
            </div>

            <div class="prefs__section">
              <label class="prefs__label">Default AI model</label>
              <select
                class="prefs__select"
                :value="defaultModel"
                @change="setModel(($event.target as HTMLSelectElement).value)"
              >
                <option value="claude-opus-4-6">Claude Opus 4.6</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
              </select>
            </div>
          </template>

          <!-- ═══ Agents ═══ -->
          <template v-if="activeTab === 'agents'">
            <div class="prefs__section">
              <label class="prefs__label">Default agent</label>
              <p class="prefs__hint">The coding agent used for new tasks. Can be changed per-task.</p>
              <div class="prefs__agent-list">
                <button
                  v-for="agent in codingAgents"
                  :key="agent.id"
                  class="prefs__agent-row"
                  :class="{ 'is-selected': defaultAgent === agent.id }"
                  @click="setAgent(agent.id)"
                >
                  <img :src="agent.icon" :alt="agent.label" class="prefs__agent-icon" />
                  <div class="prefs__agent-info">
                    <span class="prefs__agent-name">{{ agent.label }}</span>
                    <span class="prefs__agent-desc">{{ agent.description }}</span>
                  </div>
                  <WPIcon v-if="defaultAgent === agent.id" :icon="check" :size="20" class="prefs__agent-check" />
                </button>
              </div>
            </div>

            <div class="prefs__section">
              <label class="prefs__label">Agent instructions</label>
              <p class="prefs__hint">Markdown files that configure agent behavior and project context.</p>
              <div class="prefs__instructions">
                <div v-for="file in instructionFiles" :key="file.name" class="prefs__instruction-row">
                  <div class="prefs__instruction-info">
                    <WPIcon :icon="fileIcon" :size="16" class="prefs__instruction-icon" />
                    <div>
                      <span class="prefs__instruction-name">{{ file.name }}</span>
                      <span class="prefs__instruction-desc">{{ file.description }}</span>
                    </div>
                  </div>
                  <Button variant="tertiary" size="small" label="Open" />
                </div>
              </div>
            </div>
          </template>

          <!-- ═══ Skills ═══ -->
          <template v-if="activeTab === 'skills'">
            <div class="prefs__section">
              <label class="prefs__label">Agent skills</label>
              <p class="prefs__hint">Skills extend what agents can do — adding commands, card types, and specialized behavior.</p>
              <p class="prefs__empty-state">No skills installed</p>
            </div>
          </template>

          <!-- ═══ Account ═══ -->
          <template v-if="activeTab === 'account'">
            <div class="prefs__section">
              <label class="prefs__label">Anthropic API key</label>
              <p class="prefs__hint">Required for AI features. Your key is stored locally in the browser.</p>
              <div class="prefs__key-row">
                <input
                  v-model="apiKey"
                  type="password"
                  class="prefs__input"
                  placeholder="sk-ant-..."
                  spellcheck="false"
                  autocomplete="off"
                />
                <Button
                  v-if="apiKey"
                  variant="primary"
                  size="small"
                  :label="keySaved ? 'Saved' : 'Save'"
                  :disabled="keySaved"
                  @click="saveKey"
                />
                <Button
                  v-if="keyConfigured && !keySaved"
                  variant="tertiary"
                  size="small"
                  label="Clear"
                  @click="clearKey"
                />
              </div>
            </div>

            <div class="prefs__section">
              <label class="prefs__label">Data</label>
              <div class="prefs__data-row">
                <Button variant="secondary" size="small" label="Reset all data" @click="() => { localStorage.clear(); location.reload() }" />
                <span class="prefs__data-hint">Clears all local storage and reloads the prototype.</span>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.prefs {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.prefs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-m) var(--space-m) 0;
  flex-shrink: 0;
}

.prefs__title {
  margin: 0;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.prefs__close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.prefs__close:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}

/* -- Two-column body -- */

.prefs__body {
  display: flex;
  flex: 1;
  min-height: 360px;
}

.prefs__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  padding: var(--space-s) var(--space-xs);
  flex-shrink: 0;
  width: 160px;
}

.prefs__nav-item {
  display: block;
  width: 100%;
  height: 32px;
  padding: 0 var(--space-xs);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-secondary);
  font-family: inherit;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  text-align: start;
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.prefs__nav-item:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}

.prefs__nav-item.is-active {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
  font-weight: var(--font-weight-semibold);
}

.prefs__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-block-end: var(--space-m);
}

/* -- Sections -- */

.prefs__section {
  padding: var(--space-xs) var(--space-m);
}

.prefs__section:first-of-type {
  padding-block-start: var(--space-s);
}

.prefs__label {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xs);
}

.prefs__hint {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0 0 var(--space-xs);
  line-height: 1.5;
}

/* -- Appearance picker -- */

.prefs__appearance {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

.prefs__appearance-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.prefs__appearance-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-m);
  border: 2px solid var(--color-frame-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color var(--duration-instant) var(--ease-default);
}

.prefs__appearance-btn.is-active .prefs__appearance-preview {
  border-color: var(--color-primary);
}

.prefs__appearance-btn:hover:not(.is-active) .prefs__appearance-preview {
  border-color: var(--color-frame-fg-muted);
}

.prefs__appearance-name {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.prefs__appearance-btn.is-active .prefs__appearance-name {
  color: var(--color-primary);
}

/* Mini preview thumbnails */
.preview__bar {
  height: 12%;
  flex-shrink: 0;
}

.preview__body {
  flex: 1;
  display: flex;
}

.preview__sidebar {
  width: 28%;
  flex-shrink: 0;
}

.preview__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8%;
  justify-content: center;
}

.preview__line {
  height: 3px;
  border-radius: 1px;
  width: 70%;
}

.preview__line--short {
  width: 45%;
}

/* System: split half light / half dark */
.preview--system .preview__bar {
  background: linear-gradient(to right, #e5e5e5 50%, #333 50%);
}

.preview--system .preview__sidebar {
  background: linear-gradient(to bottom, #f0f0f0 50%, #1a1a1a 50%);
}

.preview--system .preview__body {
  background: linear-gradient(to bottom, #fff 50%, #111 50%);
}

.preview--system .preview__line {
  background: linear-gradient(to bottom, #d0d0d0 50%, #444 50%);
}

/* Light */
.preview--light .preview__bar {
  background: #e5e5e5;
}

.preview--light .preview__sidebar {
  background: #f0f0f0;
}

.preview--light .preview__body {
  background: #fff;
}

.preview--light .preview__line {
  background: #d0d0d0;
}

/* Dark */
.preview--dark .preview__bar {
  background: #333;
}

.preview--dark .preview__sidebar {
  background: #1a1a1a;
}

.preview--dark .preview__body {
  background: #111;
}

.preview--dark .preview__line {
  background: #444;
}

/* -- Select -- */

.prefs__select {
  display: block;
  width: 100%;
  height: 32px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: var(--font-size-s);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-inline-end: 28px;
}

.prefs__select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

/* -- API key row -- */

.prefs__key-row {
  display: flex;
  gap: var(--space-xxs);
  align-items: center;
}

.prefs__input {
  flex: 1;
  height: 32px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: var(--font-size-s);
}

.prefs__input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

.prefs__input::placeholder {
  color: var(--color-frame-fg-muted);
}

/* -- Data row -- */

.prefs__data-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.prefs__data-hint {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

/* -- Agent list -- */

.prefs__agent-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.prefs__agent-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-xs);
  border: none;
  background: var(--color-frame-bg);
  cursor: pointer;
  text-align: start;
  transition: background var(--duration-instant) var(--ease-default);
}

.prefs__agent-row + .prefs__agent-row {
  border-block-start: 1px solid var(--color-frame-border);
}

.prefs__agent-row:hover {
  background: var(--color-frame-bg-secondary);
}

.prefs__agent-row.is-selected {
  background: var(--color-frame-bg-secondary);
}

.prefs__agent-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  object-fit: contain;
}

.prefs__agent-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.prefs__agent-name {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  line-height: 1.3;
}

.prefs__agent-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

.prefs__agent-check {
  flex-shrink: 0;
  color: var(--color-primary);
}

/* -- Empty state -- */

.prefs__empty-state {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  padding: var(--space-s) 0;
}

/* -- Instructions list -- */

.prefs__instructions {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--color-frame-border);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.prefs__instruction-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-xs);
  background: var(--color-frame-bg);
}

.prefs__instruction-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
}

.prefs__instruction-icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.prefs__instruction-name {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  font-family: var(--font-mono);
}

.prefs__instruction-desc {
  display: block;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}
</style>
