<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { moreVertical } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import { getAPIKey, setAPIKey, isAIConfigured } from '@/data/ai-service'
import { codingAgents, installAgent, uninstallAgent } from '@/data/agents'
import { skills, installSkill, installAllSkills, uninstallSkill } from '@/data/skills'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// -- Escape key --

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
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

// -- Item menu --

function itemMenuGroups(label: string, onUninstall: () => void) {
  return [{ items: [{ label: 'Uninstall', destructive: true, action: onUninstall }] }]
}

function handleUninstallAgent(id: string) {
  uninstallAgent(id)
  delete installStates.value[id]
}

function handleUninstallSkill(id: string) {
  uninstallSkill(id)
  delete skillInstallStates.value[id]
}

// -- Agent lists --

const installedAgents = computed(() => codingAgents.filter(a => a.installed || getInstallState(a.id) === 'done'))
const availableAgents = computed(() => codingAgents.filter(a => !a.installed && getInstallState(a.id) !== 'done'))

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
            <Text variant="body-small" weight="semibold" class="prefs-title">Studio Preferences</Text>
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
              <div class="prefs-section">
                <Text variant="body-small" weight="semibold" class="prefs-field-label">Appearance</Text>
                <div class="prefs-appearance">
                  <button
                    v-for="mode in (['system', 'light', 'dark'] as const)"
                    :key="mode"
                    class="prefs-appearance-btn"
                    :class="{ 'is-active': appearance === mode }"
                    @click="setAppearance(mode)"
                  >
                    <div class="prefs-appearance-preview" :class="`preview--${mode}`">
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
                    <Text variant="body-small" :color="appearance === mode ? 'default' : 'muted'" weight="medium">{{ mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark' }}</Text>
                  </button>
                </div>
              </div>

              <div class="prefs-section">
                <Text variant="body-small" weight="semibold" class="prefs-field-label">Language</Text>
                <Dropdown
                  :model-value="language"
                  :groups="languageGroups"
                  :show-chevron="true"
                  max-height="320px"
                  class="prefs-dropdown-full"
                  @update:model-value="(v: string) => { language = v; localStorage.setItem(LANGUAGE_KEY, v) }"
                />
              </div>

              <div class="prefs-section">
                <div class="prefs-hstack">
                  <div class="prefs-field">
                    <Text variant="body-small" weight="semibold" class="prefs-field-label">Code editor</Text>
                    <Dropdown
                      :model-value="codeEditor"
                      :groups="editorGroups"
                      :show-chevron="true"
                      class="prefs-dropdown-full"
                      @update:model-value="(v: string) => { codeEditor = v; localStorage.setItem(EDITOR_KEY, v) }"
                    />
                  </div>
                  <div class="prefs-field">
                    <Text variant="body-small" weight="semibold" class="prefs-field-label">Terminal application</Text>
                    <Dropdown
                      :model-value="terminal"
                      :groups="terminalGroups"
                      :show-chevron="true"
                      class="prefs-dropdown-full"
                      @update:model-value="(v: string) => { terminal = v; localStorage.setItem(TERMINAL_KEY, v) }"
                    />
                  </div>
                </div>
              </div>

              <div class="prefs-section">
                <div class="prefs-toggle-row">
                  <button
                    class="prefs-toggle"
                    :class="{ 'is-on': cliEnabled }"
                    role="switch"
                    :aria-checked="cliEnabled"
                    @click="cliEnabled = !cliEnabled; localStorage.setItem(CLI_KEY, String(cliEnabled))"
                  >
                    <span class="prefs-toggle-knob" />
                  </button>
                  <Text variant="body-small">Studio CLI for terminal</Text>
                </div>
                <div class="prefs-toggle-help">
                  <Text variant="body-small" color="muted">You will be asked for admin privileges to install or uninstall the Studio CLI for use in the terminal. <a href="#" class="prefs-learn-more">Learn more</a></Text>
                </div>
              </div>

              <div class="prefs-section">
                <Text variant="body-small" weight="semibold" class="prefs-field-label">Anthropic API key</Text>
                <Text variant="body-small" color="muted" class="prefs-hint">Required for AI features. Your key is stored locally in the browser.</Text>
                <div class="prefs-key-row">
                  <input
                    v-model="apiKey"
                    type="password"
                    class="prefs-input"
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

              <div class="prefs-section">
                <Text variant="body-small" weight="semibold" class="prefs-field-label">Data</Text>
                <div class="prefs-data-row">
                  <Button variant="secondary" size="small" label="Reset all data" @click="() => { localStorage.clear(); location.reload() }" />
                  <Text variant="body-small" color="muted">Clears all local storage and reloads the prototype.</Text>
                </div>
              </div>
            </template>

            <!-- ═══ Agents ═══ -->
            <template v-if="activeTab === 'agents'">
              <Text variant="body-small" color="muted" class="prefs-description">
                Agents are AI-powered assistants that can perform actions and accomplish tasks for you.
              </Text>

              <!-- Installed -->
              <div class="prefs-group">
                <div class="prefs-group-header">
                  <Text variant="heading-small" color="muted">INSTALLED</Text>
                </div>
                <div class="prefs-list">
                  <div
                    v-for="agent in installedAgents"
                    :key="agent.id"
                    class="prefs-list-item"
                  >
                    <img :src="agent.icon" :alt="agent.label" class="prefs-list-icon" />
                    <div class="prefs-list-info">
                      <Text variant="body-small" weight="semibold">{{ agent.label }}</Text>
                      <Text variant="body-small" color="muted">{{ agent.description }}</Text>
                    </div>
                    <FlyoutMenu v-if="agent.id !== 'wpcom'" :groups="itemMenuGroups(agent.label, () => handleUninstallAgent(agent.id))" align="end">
                      <template #trigger="{ toggle }">
                        <Button variant="tertiary" size="small" :icon="moreVertical" @click="toggle" />
                      </template>
                    </FlyoutMenu>
                  </div>
                </div>
              </div>

              <!-- Available -->
              <div v-if="availableAgents.length" class="prefs-group">
                <div class="prefs-group-header">
                  <Text variant="heading-small" color="muted">AVAILABLE</Text>
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
                      <Text variant="body-small" weight="semibold">{{ agent.label }}</Text>
                      <Text variant="body-small" color="muted">{{ agent.description }}</Text>
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
                <Text variant="body-small" weight="semibold" class="prefs-field-label">Default agent</Text>
                <Dropdown
                  :model-value="defaultAgent"
                  :groups="defaultAgentGroups"
                  :show-chevron="true"
                  class="prefs-dropdown-full"
                  @update:model-value="setAgent"
                />
                <Text variant="body-small" color="muted" class="prefs-hint">This is the agent that will be used for all new tasks.</Text>
              </div>
            </template>

            <!-- ═══ Skills ═══ -->
            <template v-if="activeTab === 'skills'">
              <Text variant="body-small" color="muted" class="prefs-description">
                Agents can decide to use skills to help them accomplish specialized tasks.
              </Text>

              <!-- Installed -->
              <div class="prefs-group">
                <div class="prefs-group-header">
                  <Text variant="heading-small" color="muted">INSTALLED</Text>
                </div>
                <div v-if="installedSkills.length" class="prefs-list">
                  <div v-for="skill in installedSkills" :key="skill.id" class="prefs-list-item">
                    <div class="prefs-list-info">
                      <Text variant="body-small" weight="semibold">{{ skill.name }}</Text>
                      <Text variant="body-small" color="muted">{{ skill.description }}</Text>
                    </div>
                    <FlyoutMenu :groups="itemMenuGroups(skill.name, () => handleUninstallSkill(skill.id))" align="end">
                      <template #trigger="{ toggle }">
                        <Button variant="tertiary" size="small" :icon="moreVertical" @click="toggle" />
                      </template>
                    </FlyoutMenu>
                  </div>
                </div>
              </div>

              <!-- Available -->
              <div v-if="availableSkills.length" class="prefs-group">
                <div class="prefs-group-header">
                  <Text variant="heading-small" color="muted">AVAILABLE</Text>
                  <button class="prefs-install-all" :disabled="installingAll" @click="startInstallAll">
                    {{ installingAll ? 'Installing…' : 'Install all' }}
                  </button>
                </div>
                <div class="prefs-list">
                  <div v-for="skill in availableSkills" :key="skill.id" class="prefs-list-item">
                    <div class="prefs-list-info">
                      <Text variant="body-small" weight="semibold">{{ skill.name }}</Text>
                      <Text variant="body-small" color="muted" class="prefs-list-desc-truncate">{{ skill.description }}</Text>
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

            <!-- ═══ Account ═══ -->
            <template v-if="activeTab === 'account'">
              <div class="prefs-account">
                <img
                  src="https://2.gravatar.com/avatar/?s=80"
                  alt=""
                  class="prefs-account-avatar"
                />
                <div class="prefs-account-info">
                  <Text variant="body" weight="semibold">Shaun Andrews</Text>
                  <Text variant="body-small" color="muted">shaun@automattic.com</Text>
                </div>
                <Button variant="secondary" size="small" label="Log out" />
              </div>

              <!-- Usage -->
              <div class="prefs-section">
                <Text variant="heading-small" color="muted">USAGE</Text>
                <div class="prefs-usage-meters">
                  <div class="prefs-meter">
                    <div class="prefs-meter-header">
                      <Text variant="body-small" weight="medium">Preview sites</Text>
                      <Text variant="body-small" color="muted">1 of 10</Text>
                    </div>
                    <div class="prefs-meter-track">
                      <div class="prefs-meter-fill" style="width: 10%"></div>
                    </div>
                  </div>
                  <div class="prefs-meter">
                    <div class="prefs-meter-header">
                      <Text variant="body-small" weight="medium">AI chat</Text>
                      <Text variant="body-small" color="muted">0 of 1,000</Text>
                    </div>
                    <div class="prefs-meter-track">
                      <div class="prefs-meter-fill" style="width: 0%"></div>
                    </div>
                  </div>
                </div>
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
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 8px;
}

.prefs-traffic-dot {
  width: 12px; /* OS-native size, not on grid — intentional */
  height: 12px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: default;
}

.prefs-traffic-dot--close {
  background: var(--color-macos-close);
  cursor: pointer;
}

.prefs-traffic-dot--minimize,
.prefs-traffic-dot--maximize {
  background: var(--color-frame-border);
  pointer-events: none;
}

.prefs-title {
  user-select: none;
}

.prefs-tabs {
  display: flex;
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.prefs-tab {
  flex: 1;
  padding: var(--space-s) 0;
  border: none;
  border-block-end: 2px solid transparent;
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  cursor: pointer;
  text-align: center;
  transition: color var(--duration-instant) var(--ease-default);
}

.prefs-tab:hover {
  color: var(--color-frame-fg);
}

.prefs-tab.is-active {
  color: var(--color-frame-fg);
  border-block-end-color: var(--color-frame-theme);
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

/* -- Appearance picker -- */

.prefs-appearance {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

.prefs-appearance-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.prefs-appearance-preview {
  width: 100%;
  border-radius: var(--radius-m);
  border: 1px solid var(--color-frame-border);
  overflow: hidden;
  transition: border-color var(--duration-instant) var(--ease-default), outline-color var(--duration-instant) var(--ease-default);
}

.prefs-appearance-btn.is-active .prefs-appearance-preview {
  border-color: transparent;
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 1px;
}

.prefs-appearance-btn:hover:not(.is-active) .prefs-appearance-preview {
  border-color: var(--color-frame-fg-muted);
}

.preview__svg {
  display: block;
  width: 100%;
  height: auto;
}

/* -- Side-by-side fields -- */

.prefs-hstack {
  display: flex;
  gap: var(--space-m);
}

.prefs-field {
  flex: 1;
  min-width: 0;
}

/* -- Toggle control -- */

.prefs-toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.prefs-toggle {
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

.prefs-toggle.is-on {
  background: var(--color-frame-theme);
  border-color: var(--color-frame-theme);
}

.prefs-toggle-knob {
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

.prefs-toggle.is-on .prefs-toggle-knob {
  inset-inline-start: 17px;
  background: #fff;
}

.prefs-toggle-help {
  padding-inline-start: 40px;
  margin-block-start: var(--space-xxs);
  line-height: 1.4;
}

.prefs-learn-more {
  color: inherit;
  text-decoration: underline;
}

/* -- API key row -- */

.prefs-key-row {
  display: flex;
  gap: var(--space-xxs);
  align-items: center;
}

.prefs-input {
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

.prefs-input:focus {
  outline: 2px solid var(--color-frame-theme);
  outline-offset: -1px;
}

.prefs-input::placeholder {
  color: var(--color-frame-fg-muted);
}

/* -- Data row -- */

.prefs-data-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* -- Shared list styles (Agents & Skills) -- */

.prefs-description {
  display: block;
  text-align: center;
  margin-block-end: var(--space-m);
  line-height: 1.5;
}

/* -- Sections (General tab, standalone sections) -- */

.prefs-section {
  margin-block-start: var(--space-m);
}

.prefs-section:first-child {
  margin-block-start: 0;
}

/* -- Group wrapper (Installed / Available sections) -- */

.prefs-group {
  margin-block-start: var(--space-m);
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  overflow: clip;
}

.prefs-group:first-child {
  margin-block-start: 0;
}

.prefs-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--space-m) var(--space-xs);
  padding-block: var(--space-xs);
}


.prefs-list {
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}

.prefs-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-xs);
}

.prefs-list-item + .prefs-list-item {
  border-block-start: 1px solid var(--color-frame-border);
}

.prefs-list-icon {
  width: 36px;
  height: 36px;
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

.prefs-field-label {
  display: block;
  margin-block-end: var(--space-xs);
}

.prefs-hint {
  display: block;
  margin-block-start: var(--space-xxs);
  line-height: 1.5;
}

.prefs-dropdown-full {
  width: 100%;
}

.prefs-dropdown-full :deep(.dropdown-trigger) {
  width: 100%;
  height: 32px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  justify-content: space-between;
}

.prefs-list-desc-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* -- Account tab -- */

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

/* -- Usage meters -- */

.prefs-usage-meters {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.prefs-meter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-xs);
}

.prefs-meter-track {
  height: 4px;
  background: var(--color-frame-border);
  border-radius: 999px;
  overflow: hidden;
}

.prefs-meter-fill {
  height: 100%;
  background: var(--color-frame-theme);
  border-radius: 999px;
  transition: width var(--duration-moderate) var(--ease-default);
}

.prefs-account-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}
</style>
