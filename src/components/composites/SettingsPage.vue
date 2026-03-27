<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { moreVertical, settings as settingsIcon, commentAuthorAvatar, tool, people, bug, close as closeIcon } from '@wordpress/icons'
import BackdropPage from '@/layouts/BackdropPage.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import RadioGroup from '@/components/primitives/RadioGroup.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import { codingAgents, installAgent, uninstallAgent } from '@/data/agents'
import { skills, installSkill, installAllSkills, uninstallSkill, removeCustomSkill } from '@/data/skills'
import SettingsSection from '@/components/composites/SettingsSection.vue'
import SkillInstaller from '@/components/composites/SkillInstaller.vue'
import Badge from '@/components/primitives/Badge.vue'
import TrafficLights from '@/components/primitives/TrafficLights.vue'
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { useRouter } from 'vue-router'
import { usePersona } from '@/data/usePersona'
import { useAllSitesView } from '@/data/useAllSitesView'
import { useUnifiedSidebar } from '@/data/useUnifiedSidebar'

const props = withDefaults(defineProps<{
  open: boolean
  initialTab?: 'general' | 'agents' | 'skills' | 'account' | 'prototype'
  /** Render inline with window chrome — for design overviews */
  embedded?: boolean
  /** Lock to a specific tab (hides tab interaction) */
  lockedTab?: 'general' | 'agents' | 'skills' | 'account' | 'prototype'
  /** Override the OS chrome per-instance (for design overviews) */
  osOverride?: 'macos' | 'windows'
  /** Surface context: light (frame) or dark (chrome backdrop) */
  surface?: 'light' | 'dark'
}>(), {
  surface: 'dark',
})

const emit = defineEmits<{
  close: []
}>()

// Surface: embedded always light, backdrop always dark
const surfaceMode = computed(() => props.embedded ? 'light' : props.surface)
const isDark = computed(() => surfaceMode.value === 'dark')

// -- Escape key --

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

// -- Nav --

type Tab = 'general' | 'agents' | 'skills' | 'account' | 'prototype'
const activeTab = ref<Tab>('general')

const tabs: { id: Tab, label: string, icon: object }[] = [
  { id: 'general', label: 'General', icon: settingsIcon },
  { id: 'agents', label: 'Agents', icon: commentAuthorAvatar },
  { id: 'skills', label: 'Skills', icon: tool },
  { id: 'account', label: 'Account', icon: people },
  { id: 'prototype', label: 'Prototype', icon: bug },
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

// -- Operating System --

const { os, isWindows: globalIsWindows, setOS } = useOperatingSystem()
const isWindows = computed(() => props.osOverride ? props.osOverride === 'windows' : globalIsWindows.value)

// -- Persona --

const router = useRouter()
const { activePersonaId, personas: allPersonas, activatePersona } = usePersona()

const personaOptions = computed(() =>
  allPersonas.map(p => ({ value: p.id, label: p.name, description: p.description }))
)

function setPersona(id: string) {
  activatePersona(id, router)
  emit('close')
}

// -- All Sites toggle --

const { showAllSitesView, setShowAllSites } = useAllSitesView()
const { unifiedSidebar } = useUnifiedSidebar()

watch(() => props.open, (val) => {
  if (val) {
    activeTab.value = props.lockedTab || props.initialTab || 'general'
  }
})

// For embedded mode, set initial tab immediately
if (props.embedded) {
  activeTab.value = props.lockedTab || props.initialTab || 'general'
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
const cliEnabled = ref(localStorage.getItem(CLI_KEY) !== 'false')

function setCli(val: boolean) {
  cliEnabled.value = val
  localStorage.setItem(CLI_KEY, String(val))
}

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

function skillMenuGroups(id: string) {
  const skill = skills.find(s => s.id === id)
  if (skill?.custom) {
    return [
      { items: [{ label: 'Remove', destructive: true, action: () => removeCustomSkill(id) }] },
    ]
  }
  return [
    { items: [{ label: 'Open in VS Code', action: () => {} }] },
    { items: [{ label: 'Uninstall', destructive: true, action: () => handleUninstallSkill(id) }] },
  ]
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

const installingAllAgents = ref(false)

async function startInstallAllAgents() {
  installingAllAgents.value = true
  const toInstall = availableAgents.value.slice()
  for (const agent of toInstall) {
    installStates.value[agent.id] = 'loading'
  }
  for (const agent of toInstall) {
    await installAgent(agent.id)
    installStates.value[agent.id] = 'success'
  }
  setTimeout(() => {
    for (const agent of toInstall) {
      installStates.value[agent.id] = 'done'
    }
    installingAllAgents.value = false
  }, 1500)
}

function installLabel(id: string): string {
  const state = getInstallState(id)
  if (state === 'loading') return 'Installing…'
  if (state === 'success') return 'Installed!'
  return 'Install'
}

// -- Config files (AGENTS.md / CLAUDE.md) --

type ConfigFile = { id: string; name: string; description: string }
const configFiles: ConfigFile[] = [
  { id: 'agents-md', name: 'AGENTS.md', description: 'Instructions and rules for all coding agents on this site.' },
  { id: 'claude-md', name: 'CLAUDE.md', description: 'Project context and conventions for Claude.' },
]

const CONFIG_FILES_KEY = 'installed-config-files'

function getInstalledConfigFiles(): Set<string> {
  try {
    const stored = localStorage.getItem(CONFIG_FILES_KEY)
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

const installedConfigFiles = ref(getInstalledConfigFiles())

function installConfigFile(id: string) {
  installedConfigFiles.value.add(id)
  localStorage.setItem(CONFIG_FILES_KEY, JSON.stringify([...installedConfigFiles.value]))
}

function uninstallConfigFile(id: string) {
  installedConfigFiles.value.delete(id)
  localStorage.setItem(CONFIG_FILES_KEY, JSON.stringify([...installedConfigFiles.value]))
}

function configFileMenuGroups(id: string) {
  return [
    { items: [{ label: 'Open in VS Code', action: () => {} }] },
    { items: [{ label: 'Remove', destructive: true, action: () => uninstallConfigFile(id) }] },
  ]
}

// -- Skills install flow --

const skillInstallStates = ref<Record<string, InstallState>>({})
const installingAll = ref(false)
const installedSkills = computed(() => skills.filter(s => s.installed))
const availableSkills = computed(() => skills.filter(s => !s.installed))

function scrollToSkill(skillId: string) {
  nextTick(() => {
    const el = document.querySelector(`[data-skill-id="${skillId}"]`) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el.classList.add('settings-list-item--highlight')
    setTimeout(() => el.classList.remove('settings-list-item--highlight'), 1500)
  })
}

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
  <!-- ═══════════════════════════════════════════════════════════
       Embedded mode: window chrome, inline render (design overviews)
       ═══════════════════════════════════════════════════════════ -->
  <div v-if="embedded" class="settings-window settings-window--embedded" :class="{ 'is-windows': isWindows }">
    <!-- Window chrome: macOS -->
    <div v-if="!isWindows" class="settings-chrome">
      <TrafficLights class="settings-traffic-lights" dimmed />
      <Text variant="body-small" weight="semibold" class="settings-title">Studio Settings</Text>
    </div>
    <!-- Window chrome: Windows -->
    <div v-else class="settings-chrome settings-chrome--windows">
      <div class="settings-win-start">
        <WPIcon :icon="wordpress" :size="16" />
        <Text variant="body-small" weight="semibold" color="inherit">Studio Settings</Text>
      </div>
      <div class="settings-win-controls">
        <span class="settings-win-btn">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
        </span>
        <span class="settings-win-btn">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1" /></svg>
        </span>
        <span class="settings-win-btn settings-win-btn--close">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" /></svg>
        </span>
      </div>
    </div>

    <!-- Tabs + content (shared partial) -->
    <nav class="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="settings-tab"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="!lockedTab && (activeTab = tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>
    <div class="settings-content">
      <!-- Content is duplicated below for both modes because they share
           the same tab content but different shells. We use the same
           surface-aware primitives in both. -->
      <component :is="'div'" style="display: contents;">
        <!-- General tab content inlined for embedded (light surface) -->
        <template v-if="activeTab === 'general'">
          <div class="settings-section">
            <Text variant="body-small" weight="semibold" class="settings-field-label">Appearance</Text>
            <div class="settings-appearance">
              <button
                v-for="mode in (['system', 'light', 'dark'] as const)"
                :key="mode"
                class="settings-appearance-btn"
                :class="{ 'is-active': appearance === mode }"
                @click="setAppearance(mode)"
              >
                <div class="settings-appearance-preview" :class="`preview--${mode}`">
                  <svg viewBox="0 0 139 53" fill="none" xmlns="http://www.w3.org/2000/svg" class="preview__svg">
                    <rect width="139" height="53" fill="#131313" />
                    <rect v-if="mode === 'light'" x="26" y="4" width="109" height="96" rx="4" fill="#fff" />
                    <rect v-if="mode === 'dark'" x="26" y="4" width="109" height="96" rx="4" fill="#2f2f2f" />
                    <template v-if="mode === 'system'">
                      <defs><clipPath id="system-dark-clip"><polygon points="26,4 135,4 135,53" /></clipPath></defs>
                      <rect x="26" y="4" width="109" height="96" rx="4" fill="#fff" />
                      <rect x="26" y="4" width="109" height="96" rx="4" fill="#2f2f2f" clip-path="url(#system-dark-clip)" />
                    </template>
                    <rect x="3" y="6" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <rect x="3" y="12" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <rect x="3" y="18" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <rect x="3" y="24" width="15" height="3" rx="1" fill="white" opacity="0.3" />
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
          <div class="settings-section">
            <Text variant="body-small" weight="semibold" class="settings-field-label">Language</Text>
            <Dropdown :model-value="language" :groups="languageGroups" :show-chevron="true" max-height="320px" variant="field" width="fill" menu-surface="dark" @update:model-value="(v: string) => { language = v; localStorage.setItem(LANGUAGE_KEY, v) }" />
          </div>
          <div class="settings-section">
            <div class="settings-hstack">
              <div class="settings-field">
                <Text variant="body-small" weight="semibold" class="settings-field-label">Code editor</Text>
                <Dropdown :model-value="codeEditor" :groups="editorGroups" :show-chevron="true" variant="field" width="fill" menu-surface="dark" @update:model-value="(v: string) => { codeEditor = v; localStorage.setItem(EDITOR_KEY, v) }" />
              </div>
              <div class="settings-field">
                <Text variant="body-small" weight="semibold" class="settings-field-label">Terminal application</Text>
                <Dropdown :model-value="terminal" :groups="terminalGroups" :show-chevron="true" variant="field" width="fill" menu-surface="dark" @update:model-value="(v: string) => { terminal = v; localStorage.setItem(TERMINAL_KEY, v) }" />
              </div>
            </div>
          </div>
          <div class="settings-section">
            <Toggle v-model="cliEnabled" label="Studio CLI for terminal" @update:model-value="setCli">
              <template #hint>Use the <code class="settings-code">studio</code> command in any terminal to manage sites, run WP-CLI commands, and control your local environment. <a href="#" class="settings-learn-more">Learn more</a></template>
            </Toggle>
          </div>
        </template>

        <!-- Agents -->
        <template v-if="activeTab === 'agents'">
          <Text variant="body-small" color="muted" class="settings-description">AI-powered assistants that can complete tasks for you.</Text>
          <SettingsSection grouped>
            <template #header><Text variant="heading-small" color="muted">Installed</Text></template>
            <div v-for="agent in installedAgents" :key="agent.id" class="settings-list-item">
              <img :src="agent.icon" :alt="agent.label" class="settings-list-icon" />
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold">{{ agent.label }}</Text>
                <Text variant="body-small" color="muted">{{ agent.description }}</Text>
              </div>
              <FlyoutMenu surface="dark" v-if="agent.id !== 'wpcom'" :groups="itemMenuGroups(agent.label, () => handleUninstallAgent(agent.id))" align="end">
                <template #trigger="{ toggle }"><Button variant="tertiary" size="small" :icon="moreVertical" @click="toggle" /></template>
              </FlyoutMenu>
            </div>
          </SettingsSection>
          <SettingsSection v-if="availableAgents.length" grouped>
            <template #header>
              <Text variant="heading-small" color="muted">Available</Text>
              <Button variant="secondary" size="small" :label="installingAllAgents ? 'Installing…' : 'Install all'" :disabled="installingAllAgents" @click="startInstallAllAgents" />
            </template>
            <div v-for="agent in availableAgents" :key="agent.id" class="settings-list-item">
              <img :src="agent.icon" :alt="agent.label" class="settings-list-icon" />
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold">{{ agent.label }}</Text>
                <Text variant="body-small" color="muted">{{ agent.description }}</Text>
              </div>
              <Button variant="secondary" size="small" :label="installLabel(agent.id)" :disabled="getInstallState(agent.id) !== 'idle' || installingAllAgents" @click="startInstall(agent.id)" />
            </div>
          </SettingsSection>
          <SettingsSection grouped>
            <template #header><Text variant="heading-small" color="muted">Configuration files</Text></template>
            <div v-for="cf in configFiles" :key="cf.id" class="settings-list-item settings-list-item--skill">
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold">{{ cf.name }}</Text>
                <Text variant="body-small" color="muted">{{ cf.description }}</Text>
              </div>
              <FlyoutMenu v-if="installedConfigFiles.has(cf.id)" surface="dark" :groups="configFileMenuGroups(cf.id)" align="end">
                <template #trigger="{ toggle }"><Button variant="tertiary" size="small" :icon="moreVertical" @click="toggle" /></template>
              </FlyoutMenu>
              <Button v-else variant="secondary" size="small" label="Install" @click="installConfigFile(cf.id)" />
            </div>
          </SettingsSection>
          <div class="settings-section">
            <Text variant="body-small" weight="semibold" class="settings-field-label">Default agent</Text>
            <Dropdown :model-value="defaultAgent" :groups="defaultAgentGroups" :show-chevron="true" variant="field" width="fill" @update:model-value="setAgent" />
            <Text variant="body-small" color="muted" class="settings-hint">This is the agent that will be used for all new tasks.</Text>
          </div>
        </template>

        <!-- Skills -->
        <template v-if="activeTab === 'skills'">
          <Text variant="body-small" color="muted" class="settings-description">Agents can use skills to help with specialized tasks.</Text>
          <SettingsSection v-if="installedSkills.length" grouped>
            <template #header><Text variant="heading-small" color="muted">INSTALLED</Text></template>
            <div v-for="skill in installedSkills" :key="skill.id" :data-skill-id="skill.id" class="settings-list-item settings-list-item--skill">
              <div class="settings-list-info">
                <div class="settings-list-name-row">
                  <Text variant="body-small" weight="semibold">{{ skill.name }}</Text>
                  <Badge v-if="skill.custom" label="Custom" variant="custom" />
                </div>
                <Text variant="body-small" color="muted">{{ skill.description }}</Text>
              </div>
              <FlyoutMenu surface="dark" :groups="skillMenuGroups(skill.id)" align="end">
                <template #trigger="{ toggle }"><Button variant="tertiary" size="small" :icon="moreVertical" @click="toggle" /></template>
              </FlyoutMenu>
            </div>
          </SettingsSection>
          <SettingsSection v-if="availableSkills.length" grouped>
            <template #header>
              <Text variant="heading-small" color="muted">AVAILABLE</Text>
              <Button variant="secondary" size="small" :label="installingAll ? 'Installing…' : 'Install all'" :disabled="installingAll" @click="startInstallAll" />
            </template>
            <div v-for="skill in availableSkills" :key="skill.id" class="settings-list-item settings-list-item--skill">
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold">{{ skill.name }}</Text>
                <Text variant="body-small" color="muted" class="settings-list-desc-truncate">{{ skill.description }}</Text>
              </div>
              <Button variant="secondary" size="small" :label="skillInstallLabel(skill.id)" :disabled="getSkillInstallState(skill.id) !== 'idle' || installingAll" @click="startSkillInstall(skill.id)" />
            </div>
          </SettingsSection>
          <div class="settings-group"><SkillInstaller @added="scrollToSkill" /></div>
        </template>

        <!-- Account -->
        <template v-if="activeTab === 'account'">
          <div class="settings-account">
            <img src="https://2.gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=80" alt="" class="settings-account-avatar" />
            <div class="settings-account-info">
              <Text variant="body" weight="semibold">Shaun Andrews</Text>
              <Text variant="body-small" color="muted">shaun@automattic.com</Text>
            </div>
            <Button variant="secondary" label="Log out" />
          </div>
          <div class="settings-section pt-s">
            <Text variant="heading-small" color="muted" class="settings-field-label">USAGE</Text>
            <div class="settings-usage-meters">
              <div class="settings-meter">
                <div class="settings-meter-header">
                  <Text variant="body-small" weight="medium">Preview sites</Text>
                  <Text variant="body-small" color="muted">1 of 10</Text>
                </div>
                <div class="settings-meter-track"><div class="settings-meter-fill" style="width: 10%"></div></div>
              </div>
              <div class="settings-meter">
                <div class="settings-meter-header">
                  <Text variant="body-small" weight="medium">AI chat</Text>
                  <Text variant="body-small" color="muted">0 of 1,000</Text>
                </div>
                <div class="settings-meter-track"><div class="settings-meter-fill" style="width: 0%"></div></div>
              </div>
            </div>
          </div>
        </template>
      </component>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       Chrome backdrop mode: two-column layout behind sidebar/frame
       ═══════════════════════════════════════════════════════════ -->
  <BackdropPage v-else hide-header>
    <!-- Two-column layout -->
    <div class="settings-columns" :class="{ 'surface-dark': isDark }">
      <!-- Sidebar nav -->
      <nav class="settings-sidebar">
        <button class="settings-nav-item sidebar-close" @click="emit('close')">
          <WPIcon :icon="closeIcon" :size="20" />
          Close
        </button>
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="settings-nav-item"
          :class="{ 'is-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <WPIcon :icon="tab.icon" :size="20" />
          {{ tab.label }}
        </button>

      </nav>

      <!-- Content area (scrollable, fluid width) -->
      <div class="settings-content">

        <!-- ═══ General ═══ -->
        <template v-if="activeTab === 'general'">
          <div class="settings-section">
            <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label">Appearance</Text>
            <div class="settings-appearance">
              <button
                v-for="mode in (['system', 'light', 'dark'] as const)"
                :key="mode"
                class="settings-appearance-btn"
                :class="{ 'is-active': appearance === mode }"
                @click="setAppearance(mode)"
              >
                <div class="settings-appearance-preview" :class="`preview--${mode}`">
                  <svg viewBox="0 0 139 53" fill="none" xmlns="http://www.w3.org/2000/svg" class="preview__svg">
                    <rect width="139" height="53" fill="#131313" />
                    <rect v-if="mode === 'light'" x="26" y="4" width="109" height="96" rx="4" fill="#fff" />
                    <rect v-if="mode === 'dark'" x="26" y="4" width="109" height="96" rx="4" fill="#2f2f2f" />
                    <template v-if="mode === 'system'">
                      <defs><clipPath id="system-dark-clip-bd"><polygon points="26,4 135,4 135,53" /></clipPath></defs>
                      <rect x="26" y="4" width="109" height="96" rx="4" fill="#fff" />
                      <rect x="26" y="4" width="109" height="96" rx="4" fill="#2f2f2f" clip-path="url(#system-dark-clip-bd)" />
                    </template>
                    <rect x="3" y="6" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <rect x="3" y="12" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <rect x="3" y="18" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <rect x="3" y="24" width="15" height="3" rx="1" fill="white" opacity="0.3" />
                    <circle cx="22.5" cy="7.5" r="1.5" fill="#1fd15b" />
                    <circle cx="22.5" cy="13.5" r="1.5" fill="#1fd15b" />
                    <circle cx="22.5" cy="19.5" r="1.5" fill="white" opacity="0.2" />
                    <circle cx="22.5" cy="25.5" r="1.5" fill="#1fd15b" />
                  </svg>
                </div>
                <Text variant="body-small" :surface="surfaceMode" :color="appearance === mode ? 'default' : 'muted'" weight="medium">{{ mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark' }}</Text>
              </button>
            </div>
          </div>

          <div class="settings-section">
            <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label">Language</Text>
            <Dropdown :model-value="language" :groups="languageGroups" :show-chevron="true" max-height="320px" variant="field" width="fill" :surface="surfaceMode" menu-surface="dark" @update:model-value="(v: string) => { language = v; localStorage.setItem(LANGUAGE_KEY, v) }" />
          </div>

          <div class="settings-section">
            <div class="settings-hstack">
              <div class="settings-field">
                <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label">Code editor</Text>
                <Dropdown :model-value="codeEditor" :groups="editorGroups" :show-chevron="true" variant="field" width="fill" :surface="surfaceMode" menu-surface="dark" @update:model-value="(v: string) => { codeEditor = v; localStorage.setItem(EDITOR_KEY, v) }" />
              </div>
              <div class="settings-field">
                <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label">Terminal application</Text>
                <Dropdown :model-value="terminal" :groups="terminalGroups" :show-chevron="true" variant="field" width="fill" :surface="surfaceMode" menu-surface="dark" @update:model-value="(v: string) => { terminal = v; localStorage.setItem(TERMINAL_KEY, v) }" />
              </div>
            </div>
          </div>

          <div class="settings-section">
            <Toggle v-model="cliEnabled" label="Studio CLI for terminal" :surface="surfaceMode" @update:model-value="setCli">
              <template #hint>Use the <code class="settings-code">studio</code> command in any terminal to manage sites, run WP-CLI commands, and control your local environment. <a href="#" class="settings-learn-more">Learn more</a></template>
            </Toggle>
          </div>
        </template>

        <!-- ═══ Agents ═══ -->
        <template v-if="activeTab === 'agents'">
          <SettingsSection :surface="surfaceMode" grouped>
            <template #header><Text variant="heading-small" color="muted" :surface="surfaceMode">Installed</Text></template>
            <div v-for="agent in installedAgents" :key="agent.id" class="settings-list-item">
              <img :src="agent.icon" :alt="agent.label" class="settings-list-icon" />
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold" :surface="surfaceMode">{{ agent.label }}</Text>
                <Text variant="body-small" color="muted" :surface="surfaceMode">{{ agent.description }}</Text>
              </div>
              <FlyoutMenu surface="dark" v-if="agent.id !== 'wpcom'" :groups="itemMenuGroups(agent.label, () => handleUninstallAgent(agent.id))" align="end">
                <template #trigger="{ toggle }"><Button variant="tertiary" size="small" :surface="surfaceMode" :icon="moreVertical" @click="toggle" /></template>
              </FlyoutMenu>
            </div>
          </SettingsSection>
          <SettingsSection v-if="availableAgents.length" :surface="surfaceMode" grouped>
            <template #header>
              <Text variant="heading-small" color="muted" :surface="surfaceMode">Available</Text>
              <Button variant="secondary" size="small" :surface="surfaceMode" :label="installingAllAgents ? 'Installing…' : 'Install all'" :disabled="installingAllAgents" @click="startInstallAllAgents" />
            </template>
            <div v-for="agent in availableAgents" :key="agent.id" class="settings-list-item">
              <img :src="agent.icon" :alt="agent.label" class="settings-list-icon" />
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold" :surface="surfaceMode">{{ agent.label }}</Text>
                <Text variant="body-small" color="muted" :surface="surfaceMode">{{ agent.description }}</Text>
              </div>
              <Button variant="secondary" size="small" :surface="surfaceMode" :label="installLabel(agent.id)" :disabled="getInstallState(agent.id) !== 'idle' || installingAllAgents" @click="startInstall(agent.id)" />
            </div>
          </SettingsSection>
          <SettingsSection :surface="surfaceMode" grouped>
            <template #header><Text variant="heading-small" color="muted" :surface="surfaceMode">Configuration files</Text></template>
            <div v-for="cf in configFiles" :key="cf.id" class="settings-list-item settings-list-item--skill">
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold" :surface="surfaceMode">{{ cf.name }}</Text>
                <Text variant="body-small" color="muted" :surface="surfaceMode">{{ cf.description }}</Text>
              </div>
              <FlyoutMenu v-if="installedConfigFiles.has(cf.id)" surface="dark" :groups="configFileMenuGroups(cf.id)" align="end">
                <template #trigger="{ toggle }"><Button variant="tertiary" size="small" :surface="surfaceMode" :icon="moreVertical" @click="toggle" /></template>
              </FlyoutMenu>
              <Button v-else variant="secondary" size="small" :surface="surfaceMode" label="Install" @click="installConfigFile(cf.id)" />
            </div>
          </SettingsSection>
          <div class="settings-section">
            <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label">Default agent</Text>
            <Dropdown :model-value="defaultAgent" :groups="defaultAgentGroups" :show-chevron="true" variant="field" width="fill" :surface="surfaceMode" menu-surface="dark" @update:model-value="setAgent" />
            <Text variant="body-small" color="muted" :surface="surfaceMode" class="settings-hint">This is the agent that will be used for all new tasks.</Text>
          </div>
        </template>

        <!-- ═══ Skills ═══ -->
        <template v-if="activeTab === 'skills'">
          <SettingsSection v-if="installedSkills.length" :surface="surfaceMode" grouped>
            <template #header><Text variant="heading-small" color="muted" :surface="surfaceMode">INSTALLED</Text></template>
            <div v-for="skill in installedSkills" :key="skill.id" :data-skill-id="skill.id" class="settings-list-item settings-list-item--skill">
              <div class="settings-list-info">
                <div class="settings-list-name-row">
                  <Text variant="body-small" weight="semibold" :surface="surfaceMode">{{ skill.name }}</Text>
                  <Badge v-if="skill.custom" label="Custom" variant="custom" />
                </div>
                <Text variant="body-small" color="muted" :surface="surfaceMode">{{ skill.description }}</Text>
              </div>
              <FlyoutMenu surface="dark" :groups="skillMenuGroups(skill.id)" align="end">
                <template #trigger="{ toggle }"><Button variant="tertiary" size="small" :surface="surfaceMode" :icon="moreVertical" @click="toggle" /></template>
              </FlyoutMenu>
            </div>
          </SettingsSection>
          <SettingsSection v-if="availableSkills.length" :surface="surfaceMode" grouped>
            <template #header>
              <Text variant="heading-small" color="muted" :surface="surfaceMode">AVAILABLE</Text>
              <Button variant="secondary" size="small" :surface="surfaceMode" :label="installingAll ? 'Installing…' : 'Install all'" :disabled="installingAll" @click="startInstallAll" />
            </template>
            <div v-for="skill in availableSkills" :key="skill.id" class="settings-list-item settings-list-item--skill">
              <div class="settings-list-info">
                <Text variant="body-small" weight="semibold" :surface="surfaceMode">{{ skill.name }}</Text>
                <Text variant="body-small" color="muted" :surface="surfaceMode" class="settings-list-desc-truncate">{{ skill.description }}</Text>
              </div>
              <Button variant="secondary" size="small" :surface="surfaceMode" :label="skillInstallLabel(skill.id)" :disabled="getSkillInstallState(skill.id) !== 'idle' || installingAll" @click="startSkillInstall(skill.id)" />
            </div>
          </SettingsSection>
          <div class="settings-group"><SkillInstaller @added="scrollToSkill" /></div>
        </template>

        <!-- ═══ Account ═══ -->
        <template v-if="activeTab === 'account'">
          <div class="settings-account">
            <img src="https://2.gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=80" alt="" class="settings-account-avatar" />
            <div class="settings-account-info">
              <Text variant="body" weight="semibold" :surface="surfaceMode">Shaun Andrews</Text>
              <Text variant="body-small" color="muted" :surface="surfaceMode">shaun@automattic.com</Text>
            </div>
            <Button variant="secondary" :surface="surfaceMode" label="Log out" />
          </div>
          <div class="settings-section pt-s">
            <Text variant="heading-small" color="muted" :surface="surfaceMode" class="settings-field-label">USAGE</Text>
            <div class="settings-usage-meters">
              <div class="settings-meter">
                <div class="settings-meter-header">
                  <Text variant="body-small" weight="medium" :surface="surfaceMode">Preview sites</Text>
                  <Text variant="body-small" color="muted" :surface="surfaceMode">1 of 10</Text>
                </div>
                <div class="settings-meter-track"><div class="settings-meter-fill" style="width: 10%"></div></div>
              </div>
              <div class="settings-meter">
                <div class="settings-meter-header">
                  <Text variant="body-small" weight="medium" :surface="surfaceMode">AI chat</Text>
                  <Text variant="body-small" color="muted" :surface="surfaceMode">0 of 1,000</Text>
                </div>
                <div class="settings-meter-track"><div class="settings-meter-fill" style="width: 0%"></div></div>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══ Prototype ═══ -->
        <template v-if="activeTab === 'prototype'">
          <div class="settings-section">
            <Text variant="body-small" color="muted" :surface="surfaceMode" class="proto-notice">These settings are specific to this prototype and won't be part of the shipping product.</Text>
          </div>

          <div class="settings-section">
            <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label">Persona</Text>
            <RadioGroup :model-value="activePersonaId || ''" :options="personaOptions" name="persona" :surface="surfaceMode" @update:model-value="setPersona" />
            <Text variant="body-small" color="muted" :surface="surfaceMode" class="settings-hint">Switches immediately — resets all state and navigates to the persona's starting screen.</Text>
          </div>

          <div class="settings-section">
            <Toggle v-model="showAllSitesView" label="Show All Sites view" :surface="surfaceMode" size="small" @update:model-value="setShowAllSites">
              <template #hint>Toggle the All Sites aggregated view in the sidebar.</template>
            </Toggle>
          </div>

          <div class="settings-section">
            <Toggle v-model="isWindows" label="Windows mode" :surface="surfaceMode" size="small" @update:model-value="(v: boolean) => setOS(v ? 'windows' : 'macos')">
              <template #hint>Switch the app chrome between macOS and Windows styles.</template>
            </Toggle>
          </div>

          <div class="settings-section">
            <Toggle v-model="unifiedSidebar" label="Unified sidebar" :surface="surfaceMode" size="small">
              <template #hint>Move site navigation into the sidebar instead of a separate pane.</template>
            </Toggle>
          </div>

          <div class="settings-section">
            <Text variant="body-small" weight="semibold" :surface="surfaceMode" class="settings-field-label settings-field-label--danger">Danger zone</Text>
            <Button variant="secondary" size="small" :surface="surfaceMode" label="Reset all data" @click="() => { localStorage.clear(); location.reload() }" />
            <Text variant="body-small" color="muted" :surface="surfaceMode" class="settings-hint">Clears all local storage and reloads the prototype.</Text>
          </div>
        </template>

      </div>
    </div>
  </BackdropPage>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════
   Two-column layout
   ═══════════════════════════════════════════════════════ */

.settings-columns {
  display: flex;
  max-width: 840px;
  width: 100%;
  margin-inline: auto;
  padding-block-start: var(--space-xxxl);
  flex: 1;
}

/* ── Sidebar nav ── */

.settings-sidebar {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  padding: var(--space-m);
  padding-block-start: var(--space-l);
  position: sticky;
  inset-block-start: 0;
  align-self: flex-start;
}

.sidebar-close {
  margin-block-end: var(--space-xs);
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  height: 32px;
  padding: 0 var(--space-s);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  text-align: start;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.settings-nav-item:hover {
  color: var(--color-frame-fg);
  background: var(--color-frame-hover);
}

.settings-nav-item.is-active {
  color: var(--color-frame-fg);
  background: var(--color-frame-fill);
}

.surface-dark .settings-nav-item {
  color: var(--color-chrome-fg-muted);
}

.surface-dark .settings-nav-item:hover {
  color: var(--color-chrome-fg);
  background: var(--color-chrome-hover);
}

.surface-dark .settings-nav-item.is-active {
  color: var(--color-chrome-fg);
  background: var(--color-chrome-fill);
}

/* ═══════════════════════════════════════════════════════
   Embedded mode (design overviews): window chrome
   ═══════════════════════════════════════════════════════ */

.settings-window--embedded {
  width: 480px;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-m);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-chrome {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  flex-shrink: 0;
}

.settings-traffic-lights {
  position: absolute;
  left: 16px; /* Physical: app chrome edge */
  top: 50%;
  transform: translateY(-50%);
}

.settings-title { user-select: none; }

/* -- Windows chrome -- */

.settings-chrome--windows {
  justify-content: space-between;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  padding-inline-start: var(--space-xs);
  border-radius: var(--radius-l) var(--radius-l) 0 0;
}

.settings-win-start { display: flex; align-items: center; gap: var(--space-xs); }
.settings-win-controls { display: flex; align-items: stretch; height: 100%; }

.settings-win-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default), color var(--duration-instant) var(--ease-default);
}

.settings-win-btn:hover { background: rgba(255, 255, 255, 0.08); color: var(--color-chrome-fg); }
.settings-win-btn--close:hover { background: #e81123; color: white; }

.settings-window--embedded.is-windows { border-radius: 0; border: none; }
.settings-window--embedded.is-windows .settings-chrome--windows { border-radius: 0; }

/* ═══════════════════════════════════════════════════════
   Tabs — embedded mode only
   ═══════════════════════════════════════════════════════ */

.settings-tabs {
  display: flex;
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.settings-tab {
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

.settings-tab:hover { color: var(--color-frame-fg); }
.settings-tab.is-active { color: var(--color-frame-fg); border-block-end-color: var(--color-frame-theme); }

/* ═══════════════════════════════════════════════════════
   Content area
   ═══════════════════════════════════════════════════════ */

.settings-content {
  flex: 1;
  min-width: 0;
  padding: var(--space-m) var(--space-xl) var(--space-xl);
}

/* Embedded mode: tighter padding since it's in a small window */
.settings-window--embedded .settings-content {
  padding: var(--space-m) var(--space-xl) var(--space-xl);
}

/* -- Appearance picker -- */

.settings-appearance {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

.settings-appearance-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.settings-appearance-preview {
  width: 100%;
  border-radius: var(--radius-m);
  border: 1px solid var(--color-frame-border);
  overflow: hidden;
  transition: border-color var(--duration-instant) var(--ease-default), outline-color var(--duration-instant) var(--ease-default);
}

.settings-appearance-btn.is-active .settings-appearance-preview {
  border-color: transparent;
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 1px;
}

.settings-appearance-btn:hover:not(.is-active) .settings-appearance-preview {
  border-color: var(--color-frame-fg-muted);
}

.surface-dark .settings-appearance-preview { border-color: var(--color-chrome-border); }
.surface-dark .settings-appearance-btn.is-active .settings-appearance-preview { outline-color: var(--color-chrome-theme); }
.surface-dark .settings-appearance-btn:hover:not(.is-active) .settings-appearance-preview { border-color: var(--color-chrome-fg-muted); }

.preview__svg { display: block; width: 100%; height: auto; }

/* -- Side-by-side fields -- */

.settings-hstack { display: flex; gap: var(--space-m); }
.settings-field { flex: 1; min-width: 0; }

/* -- Inline code -- */

.settings-code {
  font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, monospace);
  font-size: 0.9em;
  padding: 1px var(--space-xxs);
  background: var(--color-frame-hover);
  border-radius: var(--radius-s);
}

.surface-dark .settings-code { background: var(--color-chrome-hover); }

.settings-learn-more { color: inherit; text-decoration: underline; }

/* -- Shared list styles (Agents & Skills) -- */

.settings-description {
  display: block;
  margin-block-end: var(--space-m);
  line-height: 1.5;
}

/* -- Sections (General tab, standalone sections) -- */

.settings-section { margin-block-start: var(--space-m); }
.settings-section:first-child { margin-block-start: 0; }

/* -- Group wrapper (Installed / Available sections) -- */

.settings-group {
  margin-block-start: var(--space-m);
  background: var(--color-chrome-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m); 
  overflow: clip;
}

.surface-dark .settings-group {
  border-color: var(--color-chrome-border);
}



.settings-group:first-child { margin-block-start: 0; }

:deep(.settings-section-wrap) {
  margin-block-start: var(--space-m);
}

:deep(.settings-section-wrap:first-child) {
  margin-block-start: 0;
}

.settings-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-m) var(--space-s);
}

.settings-list-item + .settings-list-item {
  border-block-start: 1px solid var(--color-frame-border);
}

.surface-dark .settings-list-item + .settings-list-item {
  border-block-start-color: var(--color-chrome-border);
}

.settings-list-icon { width: 36px; height: 36px; flex-shrink: 0; object-fit: contain; }
.settings-list-item--skill { padding-inline-start: var(--space-m); }

.settings-list-item--highlight { animation: skill-highlight 1.5s var(--ease-out); }

@keyframes skill-highlight {
  0%, 20% { background: rgba(160, 160, 230, 0.2); }
  100% { background: transparent; }
}

.settings-list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.settings-list-name-row { display: flex; align-items: center; gap: var(--space-xs); }

.settings-field-label { display: block; margin-block-end: var(--space-xs); }

.settings-hint { display: block; margin-block-start: var(--space-xxs); line-height: 1.5; }

.settings-list-desc-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* -- Account tab -- */

.settings-account { display: flex; align-items: center; gap: var(--space-s); }

.settings-account-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.settings-account-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

/* -- Usage meters -- */

.settings-usage-meters { display: flex; flex-direction: column; gap: var(--space-s); }

.settings-meter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-xs);
}

.settings-meter-track {
  height: 4px;
  background: var(--color-frame-border);
  border-radius: 999px;
  overflow: hidden;
}

.surface-dark .settings-meter-track { background: var(--color-chrome-border); }

.settings-meter-fill {
  height: 100%;
  background: var(--color-frame-theme);
  border-radius: 999px;
  transition: width var(--duration-moderate) var(--ease-default);
}

.surface-dark .settings-meter-fill { background: var(--color-chrome-theme); }

/* -- Prototype tab -- */

.proto-notice {
  line-height: 1.5;
  padding: var(--space-s) var(--space-m);
  background: var(--color-chrome-hover);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-m);
}

.proto-row { display: flex; gap: var(--space-xxs); align-items: center; }

.proto-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 var(--space-s);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-s);
  background: var(--color-chrome-fill);
  color: var(--color-chrome-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
}

.proto-input:focus {
  outline: none;
  border-color: var(--color-chrome-theme);
  box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

.proto-input::placeholder { color: var(--color-chrome-fg-muted); }

.settings-field-label--danger { color: var(--color-frame-danger) !important; }
</style>
