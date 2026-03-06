<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { file as fileIcon, check } from '@wordpress/icons'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import PrefsNavItem from '@/components/composites/PrefsNavItem.vue'
import Text from '@/components/primitives/Text.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { getAPIKey, setAPIKey, isAIConfigured } from '@/data/ai-service'
import { codingAgents, builtInAgent, thirdPartyAgents } from '@/data/agents'

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

const modelGroups = [
  {
    label: 'Models',
    options: [
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
  },
]

// -- Language --

const LANGUAGE_KEY = 'pref-language'
const language = ref(localStorage.getItem(LANGUAGE_KEY) || 'en')

const languageGroups = [
  {
    label: '',
    options: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'fr', label: 'Français' },
      { value: 'de', label: 'Deutsch' },
      { value: 'it', label: 'Italiano' },
      { value: 'pt-br', label: 'Português (Brasil)' },
      { value: 'nl', label: 'Nederlands' },
      { value: 'ru', label: 'Русский' },
      { value: 'tr', label: 'Türkçe' },
      { value: 'id', label: 'Bahasa Indonesia' },
      { value: 'zh-cn', label: '简体中文' },
      { value: 'zh-tw', label: '繁體中文' },
      { value: 'ja', label: '日本語' },
      { value: 'ko', label: '한국어' },
      { value: 'ar', label: 'العربية' },
      { value: 'he', label: 'עברית' },
      { value: 'sv', label: 'Svenska' },
      { value: 'pl', label: 'Polski' },
      { value: 'th', label: 'ไทย' },
      { value: 'ro', label: 'Română' },
    ],
  },
]

// -- Code editor --

const EDITOR_KEY = 'pref-code-editor'
const codeEditor = ref(localStorage.getItem(EDITOR_KEY) || 'vscode')

const editorGroups = [
  {
    label: '',
    options: [
      { value: 'vscode', label: 'Visual Studio Code' },
      { value: 'phpstorm', label: 'PhpStorm' },
      { value: 'sublime', label: 'Sublime Text' },
      { value: 'zed', label: 'Zed' },
    ],
  },
]

// -- Terminal --

const TERMINAL_KEY = 'pref-terminal'
const terminal = ref(localStorage.getItem(TERMINAL_KEY) || 'terminal')

const terminalGroups = [
  {
    label: '',
    options: [
      { value: 'terminal', label: 'Terminal (macOS)' },
      { value: 'iterm', label: 'iTerm2' },
      { value: 'warp', label: 'Warp' },
      { value: 'hyper', label: 'Hyper' },
    ],
  },
]

// -- CLI toggle --

const CLI_KEY = 'pref-studio-cli'
const cliEnabled = ref(localStorage.getItem(CLI_KEY) === 'true')

// -- Default Agent --

const AGENT_KEY = 'default-agent'
const defaultAgent = ref(localStorage.getItem(AGENT_KEY) || 'wpcom')

function setAgent(agentId: string) {
  defaultAgent.value = agentId
  localStorage.setItem(AGENT_KEY, agentId)
}

const defaultAgentGroups = computed(() => [
  {
    label: '',
    options: codingAgents
      .filter(a => a.installed)
      .map(a => ({ value: a.id, label: a.label })),
  },
])

// -- Agent instructions --

const instructionFiles = [
  { name: 'AGENTS.md', description: 'Agent behavior, tools, and integration rules' },
  { name: 'CLAUDE.md', description: 'Project context and coding conventions' },
]
</script>

<template>
  <Modal :open="open" width="640px" title="Preferences" @close="emit('close')">
    <div class="prefs">
      <div class="prefs__body">
        <!-- Nav -->
        <nav class="prefs__nav">
          <PrefsNavItem
            v-for="tab in tabs"
            :key="tab.id"
            :label="tab.label"
            :active="activeTab === tab.id"
            @click="activeTab = tab.id"
          />
        </nav>

        <!-- Content -->
        <div class="prefs__content">

          <!-- ═══ General ═══ -->
          <template v-if="activeTab === 'general'">
            <div class="prefs__section">
              <Text variant="caption" weight="semibold" class="prefs__label">Appearance</Text>
              <div class="prefs__appearance">
                <button
                  v-for="mode in (['system', 'light', 'dark'] as const)"
                  :key="mode"
                  class="prefs__appearance-btn"
                  :class="{ 'is-active': appearance === mode }"
                  @click="setAppearance(mode)"
                >
                  <div class="prefs__appearance-preview" :class="`preview--${mode}`">
                    <svg viewBox="0 0 139 53" fill="none" xmlns="http://www.w3.org/2000/svg" class="preview__svg">
                      <!-- Dark background -->
                      <rect width="139" height="53" fill="#131313" />
                      <!-- Content panel -->
                      <rect v-if="mode === 'light'" x="26" y="4" width="109" height="96" rx="4" fill="#fff" />
                      <rect v-if="mode === 'dark'" x="26" y="4" width="109" height="96" rx="4" fill="#2f2f2f" />
                      <template v-if="mode === 'system'">
                        <defs>
                          <clipPath id="system-clip">
                            <rect x="26" y="4" width="109" height="96" rx="4" />
                          </clipPath>
                        </defs>
                        <rect x="26" y="4" width="109" height="96" rx="4" fill="#fff" />
                        <rect x="26" y="4" width="109" height="96" rx="4" fill="#2f2f2f" clip-path="url(#system-clip)" style="clip-path: polygon(100% 0, 0 100%, 100% 100%)" />
                      </template>
                      <!-- Sidebar items -->
                      <rect x="3" y="6" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                      <rect x="3" y="12" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                      <rect x="3" y="18" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                      <rect x="3" y="24" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                      <!-- Status dots -->
                      <circle cx="22.5" cy="7.5" r="1.5" fill="#1fd15b" />
                      <circle cx="22.5" cy="13.5" r="1.5" fill="#1fd15b" />
                      <circle cx="22.5" cy="19.5" r="1.5" fill="white" opacity="0.2" />
                      <circle cx="22.5" cy="25.5" r="1.5" fill="#1fd15b" />
                    </svg>
                  </div>
                  <Text variant="caption" :color="appearance === mode ? 'default' : 'muted'" weight="medium">{{ mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark' }}</Text>
                </button>
              </div>
            </div>

            <div class="prefs__section">
              <Text variant="caption" weight="semibold" class="prefs__label">Language</Text>
              <Dropdown
                :model-value="language"
                :groups="languageGroups"
                :show-chevron="true"
                max-height="320px"
                class="prefs__dropdown-full"
                @update:model-value="(v: string) => { language = v; localStorage.setItem(LANGUAGE_KEY, v) }"
              />
            </div>

            <div class="prefs__section">
              <div class="prefs__hstack">
                <div class="prefs__field">
                  <Text variant="caption" weight="semibold" class="prefs__label">Code editor</Text>
                  <Dropdown
                    :model-value="codeEditor"
                    :groups="editorGroups"
                    :show-chevron="true"
                    class="prefs__dropdown-full"
                    @update:model-value="(v: string) => { codeEditor = v; localStorage.setItem(EDITOR_KEY, v) }"
                  />
                </div>
                <div class="prefs__field">
                  <Text variant="caption" weight="semibold" class="prefs__label">Terminal application</Text>
                  <Dropdown
                    :model-value="terminal"
                    :groups="terminalGroups"
                    :show-chevron="true"
                    class="prefs__dropdown-full"
                    @update:model-value="(v: string) => { terminal = v; localStorage.setItem(TERMINAL_KEY, v) }"
                  />
                </div>
              </div>
            </div>

            <div class="prefs__section">
              <div class="prefs__toggle-row">
                <button
                  class="prefs__toggle"
                  :class="{ 'is-on': cliEnabled }"
                  role="switch"
                  :aria-checked="cliEnabled"
                  @click="cliEnabled = !cliEnabled; localStorage.setItem(CLI_KEY, String(cliEnabled))"
                >
                  <span class="prefs__toggle-knob" />
                </button>
                <Text variant="caption">Studio CLI for terminal</Text>
              </div>
              <div class="prefs__toggle-help">
                <Text variant="small" color="muted">You will be asked for admin privileges to install or uninstall the Studio CLI for use in the terminal. <a href="#" class="prefs__learn-more">Learn more</a></Text>
              </div>
            </div>
          </template>

          <!-- ═══ Agents ═══ -->
          <template v-if="activeTab === 'agents'">
            <div class="prefs__section">
              <Text variant="caption" weight="semibold" class="prefs__label">Available agents</Text>
              <Text variant="caption" color="muted" class="prefs__hint">Coding agents connect to Studio via the Agent Communication Protocol (ACP). WordPress.com is built-in — others can be installed separately.</Text>
              <div class="prefs__agent-list">
                <div
                  v-for="agent in codingAgents"
                  :key="agent.id"
                  class="prefs__agent-row"
                >
                  <img :src="agent.icon" :alt="agent.label" class="prefs__agent-icon" />
                  <div class="prefs__agent-info">
                    <Text variant="caption" weight="semibold">{{ agent.label }}</Text>
                    <Text variant="caption" color="muted">{{ agent.description }}</Text>
                    <Text v-if="!agent.installed && agent.installHint" variant="small" color="muted" class="prefs__agent-install">{{ agent.installHint }}</Text>
                  </div>
                  <Text v-if="agent.installed" variant="small" color="muted">Installed</Text>
                  <Button v-else variant="secondary" size="small" label="Install" />
                </div>
              </div>
            </div>

            <div class="prefs__section">
              <Text variant="caption" weight="semibold" class="prefs__label">Default agent</Text>
              <Text variant="caption" color="muted" class="prefs__hint">The agent used for new tasks. Can be changed per-task.</Text>
              <Dropdown
                :model-value="defaultAgent"
                :groups="defaultAgentGroups"
                :show-chevron="true"
                class="prefs__dropdown-full"
                @update:model-value="setAgent"
              />
            </div>

            <div class="prefs__section">
              <Text variant="caption" weight="semibold" class="prefs__label">Agent instructions</Text>
              <Text variant="caption" color="muted" class="prefs__hint">Markdown files that configure agent behavior and site context.</Text>
              <div class="prefs__instructions">
                <div v-for="file in instructionFiles" :key="file.name" class="prefs__instruction-row">
                  <div class="prefs__instruction-info">
                    <WPIcon :icon="fileIcon" :size="16" class="prefs__instruction-icon" />
                    <div>
                      <Text variant="caption" weight="medium" class="prefs__instruction-name">{{ file.name }}</Text>
                      <Text variant="caption" color="muted">{{ file.description }}</Text>
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
              <Text variant="caption" weight="semibold" class="prefs__label">Agent skills</Text>
              <Text variant="caption" color="muted" class="prefs__hint">Skills extend what agents can do — adding commands, card types, and specialized behavior.</Text>
              <Text variant="caption" color="muted" class="prefs__empty-state">No skills installed</Text>
            </div>
          </template>

          <!-- ═══ Account ═══ -->
          <template v-if="activeTab === 'account'">
            <div class="prefs__section">
              <Text variant="caption" weight="semibold" class="prefs__label">Anthropic API key</Text>
              <Text variant="caption" color="muted" class="prefs__hint">Required for AI features. Your key is stored locally in the browser.</Text>
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
              <Text variant="caption" weight="semibold" class="prefs__label">Data</Text>
              <div class="prefs__data-row">
                <Button variant="secondary" size="small" label="Reset all data" @click="() => { localStorage.clear(); location.reload() }" />
                <Text variant="caption" color="muted">Clears all local storage and reloads the prototype.</Text>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>
    <template #footer>
      <Button variant="secondary" label="Cancel" @click="emit('close')" />
      <Button variant="primary" label="Save" @click="emit('close')" />
    </template>
  </Modal>
</template>

<style>
/* Override Modal's scroll — prefs manages its own scrolling */
.modal-content:has(.prefs) {
  overflow: hidden;
  padding: 0;
}
</style>

<style scoped>
.prefs__body {
  display: flex;
  height: 460px;
  overflow: hidden;
}

.prefs__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  flex-shrink: 0;
  width: 184px;
  padding: 0 var(--space-m) 0 var(--space-s);
}

.prefs__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-block-end: var(--space-m);
  padding-inline-end: var(--space-xl);
}

/* -- Sections -- */

.prefs__section {
  padding: var(--space-xs) 0;
}

.prefs__section:first-of-type {
  padding-block-start: 0;
}

.prefs__label {
  display: block;
  margin-block-end: var(--space-xs);
}

.prefs__hint {
  display: block;
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
  border-radius: var(--radius-m);
  border: 1px solid var(--color-frame-border);
  overflow: hidden;
  transition: border-color var(--duration-instant) var(--ease-default), outline-color var(--duration-instant) var(--ease-default);
}

.prefs__appearance-btn.is-active .prefs__appearance-preview {
  border-color: transparent;
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 1px;
}

.prefs__appearance-btn:hover:not(.is-active) .prefs__appearance-preview {
  border-color: var(--color-frame-fg-muted);
}

.preview__svg {
  display: block;
  width: 100%;
  height: auto;
}

/* -- Side-by-side fields -- */

.prefs__hstack {
  display: flex;
  gap: var(--space-m);
}

.prefs__field {
  flex: 1;
  min-width: 0;
}

.prefs__field .prefs__label {
  margin-block-end: var(--space-xs);
}

/* -- Toggle control -- */

.prefs__toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.prefs__toggle {
  position: relative;
  width: 32px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--color-frame-fg-muted);
  border-radius: 999px;
  background: var(--color-frame-bg);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--duration-instant) var(--ease-default), border-color var(--duration-instant) var(--ease-default);
}

.prefs__toggle.is-on {
  background: var(--color-frame-theme);
  border-color: var(--color-frame-theme);
}

.prefs__toggle-knob {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 1px;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: var(--radius-l);
  background: var(--color-frame-fg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: inset-inline-start var(--duration-instant) var(--ease-default);
}

.prefs__toggle.is-on .prefs__toggle-knob {
  inset-inline-start: 17px;
  background: #fff;
}

.prefs__toggle-help {
  padding-inline-start: 40px;
  margin-block-start: var(--space-xxs);
  line-height: 1.4;
}

.prefs__learn-more {
  color: inherit;
  text-decoration: underline;
}

/* -- Dropdown full-width -- */

.prefs__dropdown-full {
  width: 100%;
}

.prefs__dropdown-full :deep(.dropdown-trigger) {
  width: 100%;
  height: 32px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  justify-content: space-between;
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
  outline: 2px solid var(--color-frame-theme);
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
  align-items: flex-start;
  gap: var(--space-s);
  width: 100%;
  padding: var(--space-s);
  background: var(--color-frame-bg);
  cursor: pointer;
  text-align: start;
  transition: background var(--duration-instant) var(--ease-default);
}

.prefs__agent-row + .prefs__agent-row {
  border-block-start: 1px solid var(--color-frame-border);
}

.prefs__agent-row:hover {
  background: var(--color-frame-hover);
}

.prefs__agent-row.is-selected {
  background: var(--color-frame-hover);
}

.prefs__agent-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  object-fit: contain;
}

.prefs__agent-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  flex: 1;
  min-width: 0;
}

.prefs__agent-install {
  font-family: var(--font-mono);
  opacity: 0.7;
}

.prefs__agent-check {
  flex-shrink: 0;
  color: var(--color-frame-theme);
  margin-block-start: var(--space-xxs);
}

/* -- Empty state -- */

.prefs__empty-state {
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
  padding: var(--space-xs);
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
  font-family: var(--font-mono);
}
</style>
