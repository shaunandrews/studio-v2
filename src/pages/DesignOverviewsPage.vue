<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { toPng } from 'html-to-image'
import { useSites } from '@/data/useSites'
import { skills } from '@/data/skills'
import PreferencesModal from '@/components/composites/PreferencesModal.vue'
import SiteSettingsGeneral from '@/components/features/site-settings/SiteSettingsGeneral.vue'
import SiteSettingsAdmin from '@/components/features/site-settings/SiteSettingsAdmin.vue'
import SiteSettingsSkills from '@/components/features/site-settings/SiteSettingsSkills.vue'
import SiteSettingsDebugging from '@/components/features/site-settings/SiteSettingsDebugging.vue'
import SiteSkillsModal from '@/components/features/SiteSkillsModal.vue'

type Section = 'studio-settings' | 'site-settings'
const activeSection = ref<Section>('studio-settings')

const sections: { id: Section; label: string }[] = [
  { id: 'studio-settings', label: 'Studio Settings' },
  { id: 'site-settings', label: 'Site Settings' },
]

// Ensure a mix of installed/uninstalled skills for the overview
const installedSkillIds = new Set(['wordpress-router', 'wp-block-development', 'wp-block-themes'])
for (const skill of skills) {
  skill.installed = installedSkillIds.has(skill.id)
}

// Set sample skill overrides on a second site for the overview
const { updateSite } = useSites()
updateSite('portfolio', {
  skillOverrides: {
    'wp-interactivity-api': 'enabled',
    'wp-performance': 'enabled',
    'wordpress-router': 'disabled',
  },
})

// -- Export helpers --
function getBgColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-frame-bg').trim() || '#ffffff'
}

async function captureElement(el: HTMLElement, filename: string) {
  // Wrap in a padded container so shadows aren't clipped
  const wrapper = document.createElement('div')
  wrapper.style.display = 'inline-block'
  wrapper.style.padding = '24px'
  wrapper.style.background = getBgColor()

  el.parentNode!.insertBefore(wrapper, el)
  wrapper.appendChild(el)

  try {
    const dataUrl = await toPng(wrapper, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } finally {
    // Unwrap — put element back
    wrapper.parentNode!.insertBefore(el, wrapper)
    wrapper.remove()
  }
}

// -- Screenshot: full row --
const captureRef = ref<HTMLElement | null>(null)
const saving = ref(false)

async function saveScreenshot() {
  if (!captureRef.value || saving.value) return
  saving.value = true
  try {
    await captureElement(captureRef.value, `${activeSection.value}-overview.png`)
  } finally {
    saving.value = false
  }
}

// -- Pick mode: click individual panels to export --
const pickMode = ref(false)
const pickSaving = ref(false)

async function pickPanel(e: MouseEvent) {
  if (!pickMode.value || pickSaving.value) return

  const target = (e.target as HTMLElement).closest('.overviews__panel') as HTMLElement | null
  if (!target) return

  pickSaving.value = true
  try {
    await captureElement(target, `${activeSection.value}-panel.png`)
  } finally {
    pickSaving.value = false
    pickMode.value = false
  }
}
</script>

<template>
  <div class="overviews">
    <nav class="overviews__nav">
      <div class="overviews__nav-start">
        <button
          class="overviews__screenshot-btn"
          :class="{ 'is-active': pickMode }"
          @click="pickMode = !pickMode"
        >
          {{ pickMode ? 'Cancel' : 'Pick to export' }}
        </button>
      </div>
      <div class="overviews__nav-tabs">
        <button
          v-for="section in sections"
          :key="section.id"
          class="overviews__nav-btn"
          :class="{ 'is-active': activeSection === section.id }"
          @click="activeSection = section.id"
        >
          {{ section.label }}
        </button>
      </div>
      <div class="overviews__nav-end">
        <button class="overviews__screenshot-btn" :disabled="saving" @click="saveScreenshot">
          {{ saving ? 'Saving…' : 'Save all' }}
        </button>
      </div>
    </nav>

    <div
      class="overviews__body"
      :class="{ 'is-picking': pickMode }"
      @click="pickPanel"
    >
      <!-- Studio Settings -->
      <template v-if="activeSection === 'studio-settings'">
        <div ref="captureRef" class="overviews__row">
          <div class="overviews__panel">
            <PreferencesModal :open="true" embedded locked-tab="general" />
          </div>
          <div class="overviews__panel">
            <PreferencesModal :open="true" embedded locked-tab="agents" />
          </div>
          <div class="overviews__panel overviews__panel--capped">
            <PreferencesModal :open="true" embedded locked-tab="skills" os-override="windows" />
          </div>
          <div class="overviews__panel">
            <PreferencesModal :open="true" embedded locked-tab="account" os-override="windows" />
          </div>
        </div>
      </template>

      <!-- Site Settings -->
      <template v-if="activeSection === 'site-settings'">
        <div ref="captureRef" class="overviews__row">
          <div class="overviews__panel overviews__panel--section">
            <SiteSettingsGeneral site-id="downstreet-cafe" />
          </div>
          <div class="overviews__panel overviews__panel--section">
            <SiteSettingsAdmin site-id="downstreet-cafe" />
          </div>
          <div class="overviews__panel overviews__panel--section overviews__panel--vstack">
            <SiteSettingsSkills site-id="downstreet-cafe" />
            <SiteSettingsSkills site-id="portfolio" />
          </div>
          <div class="overviews__panel overviews__panel--section">
            <SiteSettingsDebugging site-id="downstreet-cafe" />
          </div>
          <div class="overviews__panel overviews__panel--modal">
            <SiteSkillsModal :open="true" embedded site-id="portfolio" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overviews {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.overviews__nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: var(--space-m) var(--space-xl);
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.overviews__nav-start {
  display: flex;
  align-items: center;
  justify-self: start;
}

.overviews__nav-tabs {
  display: flex;
  gap: var(--space-xs);
}

.overviews__nav-end {
  display: flex;
  justify-self: end;
}

.overviews__screenshot-btn {
  padding: var(--space-xxs) var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-hover), color var(--transition-hover), border-color var(--transition-hover);
}

.overviews__screenshot-btn:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.overviews__screenshot-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.overviews__screenshot-btn.is-active {
  border-color: var(--color-frame-theme);
  color: var(--color-frame-theme);
}

.overviews__nav-btn {
  padding: var(--space-xxs) var(--space-s);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-hover), color var(--transition-hover);
}

.overviews__nav-btn:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.overviews__nav-btn.is-active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.overviews__body {
  flex: 1;
  overflow: auto;
  padding: var(--space-xl);
}

/* Pick mode: panels get a hover highlight and crosshair cursor */
.overviews__body.is-picking {
  cursor: crosshair;
}

.overviews__body.is-picking .overviews__panel {
  border-radius: var(--radius-m);
  outline: 2px solid transparent;
  outline-offset: var(--space-xs);
  transition: outline-color var(--duration-instant) var(--ease-default);
}

.overviews__body.is-picking .overviews__panel:hover {
  outline-color: var(--color-frame-theme);
}

.overviews__row {
  display: inline-flex;
  gap: var(--space-xl);
  align-items: flex-start;
}

.overviews__panel {
  flex-shrink: 0;
  width: 480px;
}

.overviews__panel--section {
  width: 360px;
}

.overviews__panel--vstack {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.overviews__panel--modal {
  width: 560px;
}

.overviews__panel--capped :deep(.prefs-window),
.overviews__panel--modal :deep(.modal-panel--embedded) {
  max-height: 780px;
}

.overviews__panel--capped :deep(.prefs-content),
.overviews__panel--modal :deep(.modal-content) {
  overflow-y: auto;
}
</style>
