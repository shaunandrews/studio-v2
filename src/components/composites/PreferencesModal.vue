<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { file as fileIcon, check } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { getAPIKey, setAPIKey, isAIConfigured } from '@/data/ai-service'
import { codingAgents, installAgent } from '@/data/agents'
import { skills, installSkill, installAllSkills, fetchSkillContent, SKILLS_REPO_URL } from '@/data/skills'
import Toggle from '@/components/primitives/Toggle.vue'
import MarkdownText from '@/components/composites/renderers/MarkdownText.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// -- Escape key --

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

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

// -- Agent enabled state --

const AGENT_ENABLED_KEY = 'agent-enabled'

function getAgentEnabledMap(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(AGENT_ENABLED_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const agentEnabled = ref<Record<string, boolean>>(getAgentEnabledMap())

function isAgentEnabled(id: string): boolean {
  return agentEnabled.value[id] !== false
}

function toggleAgent(id: string, val: boolean) {
  agentEnabled.value[id] = val
  localStorage.setItem(AGENT_ENABLED_KEY, JSON.stringify(agentEnabled.value))
}

// -- Agent install flow --

type InstallState = 'idle' | 'loading' | 'success' | 'done'
const installStates = ref<Record<string, InstallState>>({})

function getInstallState(id: string): InstallState {
  return installStates.value[id] || 'idle'
}

async function startInstall(id: string) {
  installStates.value[id] = 'loading'
  await installAgent(id)
  installStates.value[id] = 'success'
  setTimeout(() => {
    installStates.value[id] = 'done'
  }, 1500)
}

function installLabel(id: string): string {
  const state = getInstallState(id)
  if (state === 'loading') return 'Installing…'
  if (state === 'success') return 'Installed!'
  return 'Install'
}

// -- Skills install flow --

const skillInstallStates = ref<Record<string, InstallState>>({})
const installingAll = ref(false)
const viewingSkill = ref<string | null>(null)
const skillContent = ref('')
const skillContentLoading = ref(false)

async function viewSkill(id: string | null) {
  if (!id || id === viewingSkill.value) {
    viewingSkill.value = null
    skillContent.value = ''
    return
  }
  viewingSkill.value = id
  skillContentLoading.value = true
  skillContent.value = ''
  const content = await fetchSkillContent(id)
  if (viewingSkill.value === id) {
    skillContent.value = content
    skillContentLoading.value = false
  }
}

const installedSkills = computed(() => skills.filter(s => s.installed))
const availableSkills = computed(() => skills.filter(s => !s.installed))

function getSkillInstallState(id: string): InstallState {
  return skillInstallStates.value[id] || 'idle'
}

async function startSkillInstall(id: string) {
  skillInstallStates.value[id] = 'loading'
  await installSkill(id)
  skillInstallStates.value[id] = 'success'
  setTimeout(() => {
    skillInstallStates.value[id] = 'done'
  }, 1200)
}

async function startInstallAll() {
  installingAll.value = true
  const toInstall = skills.filter(s => !s.installed)
  for (const s of toInstall) {
    skillInstallStates.value[s.id] = 'loading'
  }
  await installAllSkills()
  for (const s of toInstall) {
    skillInstallStates.value[s.id] = 'success'
  }
  setTimeout(() => {
    for (const s of toInstall) {
      skillInstallStates.value[s.id] = 'done'
    }
    installingAll.value = false
  }, 1200)
}

function skillInstallLabel(id: string): string {
  const state = getSkillInstallState(id)
  if (state === 'loading') return 'Installing…'
  if (state === 'success') return 'Installed!'
  return 'Install'
}

// -- Agent instructions --

const instructionFiles = [
  { name: 'AGENTS.md', description: 'Agent behavior, tools, and integration rules' },
  { name: 'CLAUDE.md', description: 'Project context and coding conventions' },
]
</script>

<template>
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

            <!-- ═══ Agents ═══ -->
            <template v-if="activeTab === 'agents'">

              <!-- Built-in hero card -->
              <div class="prefs__section">
                <div class="prefs__agent-hero">
                  <img :src="codingAgents[0].icon" :alt="codingAgents[0].label" class="prefs__agent-hero-icon" />
                  <div class="prefs__agent-hero-info">
                    <Text variant="caption" weight="semibold">{{ codingAgents[0].label }}</Text>
                    <Text variant="caption" color="muted">{{ codingAgents[0].description }}</Text>
                  </div>
                  <Toggle :model-value="true" />
                </div>
              </div>

              <!-- Third-party agent grid -->
              <div class="prefs__section">
                <Text variant="caption" weight="semibold" class="prefs__label">Third-party agents</Text>
                <div class="prefs__agent-grid">
                  <div
                    v-for="agent in codingAgents.slice(1)"
                    :key="agent.id"
                    class="prefs__agent-card"
                    :class="{
                      'is-installed': agent.installed || getInstallState(agent.id) === 'done',
                    }"
                  >
                    <div class="prefs__agent-card-toggle">
                      <Toggle
                        v-if="agent.installed || getInstallState(agent.id) === 'done'"
                        :model-value="isAgentEnabled(agent.id)"
                        @update:model-value="toggleAgent(agent.id, $event)"
                      />
                    </div>
                    <img :src="agent.icon" :alt="agent.label" class="prefs__agent-card-icon" />
                    <Text variant="caption" weight="semibold">{{ agent.label }}</Text>
                    <Text variant="small" color="muted" class="prefs__agent-card-desc">{{ agent.description }}</Text>
                    <div v-if="!agent.installed && getInstallState(agent.id) !== 'done'" class="prefs__agent-card-install">
                      <Button
                        :variant="getInstallState(agent.id) === 'success' ? 'primary' : 'secondary'"
                        size="small"
                        width="full"
                        :label="installLabel(agent.id)"
                        :disabled="getInstallState(agent.id) !== 'idle'"
                        @click="startInstall(agent.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Default agent -->
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

              <!-- Agent instructions -->
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

              <!-- Installed -->
              <div class="prefs__section">
                <Text variant="caption" weight="semibold" class="prefs__label">Installed</Text>
                <div v-if="installedSkills.length" class="prefs__skill-list">
                  <div
                    v-for="skill in installedSkills"
                    :key="skill.id"
                    class="prefs__skill-row"
                    :class="{ 'is-viewing': viewingSkill === skill.id }"
                  >
                    <div class="prefs__skill-info">
                      <Text variant="caption" weight="semibold">{{ skill.name }}</Text>
                      <Text variant="small" color="muted">{{ skill.description }}</Text>
                    </div>
                    <button class="prefs__skill-view" @click="viewSkill(skill.id)">{{ viewingSkill === skill.id ? 'Close' : 'View' }}</button>
                  </div>
                </div>
                <Text v-else variant="caption" color="muted" class="prefs__empty-state">No skills installed yet</Text>
              </div>

              <!-- Available -->
              <div v-if="availableSkills.length" class="prefs__section">
                <div class="prefs__section-header">
                  <Text variant="caption" weight="semibold">
                    Available ({{ availableSkills.length }})
                  </Text>
                  <button
                    class="prefs__install-all"
                    :disabled="installingAll"
                    @click="startInstallAll"
                  >
                    {{ installingAll ? 'Installing…' : 'Install All' }}
                  </button>
                </div>
                <div class="prefs__skill-list">
                  <div
                    v-for="skill in availableSkills"
                    :key="skill.id"
                    class="prefs__skill-row"
                    :class="{ 'is-viewing': viewingSkill === skill.id }"
                  >
                    <div class="prefs__skill-info">
                      <Text variant="caption" weight="semibold">{{ skill.name }}</Text>
                      <Text variant="small" color="muted">{{ skill.description }}</Text>
                    </div>
                    <div class="prefs__skill-actions">
                      <button class="prefs__skill-view" @click="viewSkill(skill.id)">{{ viewingSkill === skill.id ? 'Close' : 'View' }}</button>
                      <Button
                        :variant="getSkillInstallState(skill.id) === 'success' ? 'primary' : 'secondary'"
                        size="small"
                        :label="skillInstallLabel(skill.id)"
                        :disabled="getSkillInstallState(skill.id) !== 'idle' || installingAll"
                        @click="startSkillInstall(skill.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Source attribution -->
              <div class="prefs__section">
                <Text variant="small" color="muted">Skills from <a :href="SKILLS_REPO_URL" target="_blank" class="prefs__learn-more">WordPress/agent-skills</a></Text>
              </div>

            </template>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* -- Window shell -- */

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

/* -- Transitions -- */

.modal-enter-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .prefs-window {
  animation: prefs-scale-in var(--duration-fast) var(--ease-default);
}

.modal-leave-active .prefs-window {
  animation: prefs-scale-out var(--duration-fast) var(--ease-default);
}

@keyframes prefs-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes prefs-scale-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* -- Tab content (existing styles, kept for later cleanup) -- */

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

/* -- Hero agent card (built-in) -- */

.prefs__agent-hero {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-xs) var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  transition: background var(--duration-instant) var(--ease-default);
}

.prefs__agent-hero:hover {
  background: var(--color-frame-hover);
}

.prefs__agent-hero-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  object-fit: contain;
}

.prefs__agent-hero-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  flex: 1;
  min-width: 0;
}

/* -- Agent card grid -- */

.prefs__agent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xs);
}

.prefs__agent-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
  padding: var(--space-s) var(--space-xs) var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  text-align: center;
  opacity: 0.45;
  transition:
    opacity var(--duration-fast) var(--ease-default),
    background var(--duration-instant) var(--ease-default);
}

.prefs__agent-card:hover {
  background: var(--color-frame-hover);
  opacity: 0.75;
}

.prefs__agent-card.is-installed {
  opacity: 1;
}

.prefs__agent-card.is-installed:hover {
  opacity: 1;
}

.prefs__agent-card-toggle {
  position: absolute;
  inset-block-start: var(--space-xxs);
  inset-inline-end: var(--space-xxs);
}

.prefs__agent-card-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.prefs__agent-card-desc {
  line-height: 1.3;
}

.prefs__agent-card-install {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-block-start: auto;
  padding-block-start: var(--space-xxs);
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

/* -- Skills -- */

.prefs__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-xs);
}

.prefs__install-all {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-frame-theme);
  font-family: inherit;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.prefs__install-all:hover {
  text-decoration: underline;
}

.prefs__install-all:disabled {
  opacity: 0.5;
  cursor: default;
  text-decoration: none;
}

.prefs__skill-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.prefs__skill-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s);
  padding: var(--space-s);
  background: var(--color-frame-bg);
}

.prefs__skill-row + .prefs__skill-row {
  border-block-start: 1px solid var(--color-frame-border);
}

.prefs__skill-row.is-viewing {
  background: var(--color-frame-hover);
}

.prefs__skill-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.prefs__skill-compat {
  font-style: italic;
  opacity: 0.7;
}

.prefs__skill-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.prefs__skill-view {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-s);
  cursor: pointer;
  white-space: nowrap;
}

.prefs__skill-view:hover {
  color: var(--color-frame-fg);
  text-decoration: underline;
}
</style>
