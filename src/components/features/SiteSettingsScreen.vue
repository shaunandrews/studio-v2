<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSites } from '@/data/useSites'
import { skills } from '@/data/skills'
import Button from '@/components/primitives/Button.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import Text from '@/components/primitives/Text.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import SiteSkillsModal from '@/components/features/SiteSkillsModal.vue'
import { seen as seenIcon, unseen as unseenIcon, copy as copyIcon, check as checkIcon } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  'manage-global-skills': []
}>()

const { sites, updateSite } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

// --- Site settings mock state ---
const siteName = computed({
  get: () => site.value?.name ?? '',
  set: (val: string) => { if (site.value) updateSite(site.value.id, { name: val }) },
})
const localPath = ref('/Users/shaun/Studio/shauns-blog')
const pathCopied = ref(false)
const domainCopied = ref(false)

function copyPath() {
  navigator.clipboard.writeText(localPath.value)
  pathCopied.value = true
  setTimeout(() => { pathCopied.value = false }, 1500)
}

function copyDomain() {
  navigator.clipboard.writeText(customDomain.value)
  domainCopied.value = true
  setTimeout(() => { domainCopied.value = false }, 1500)
}
const phpVersion = ref('8.3')
const wpVersion = ref('latest')
const useCustomDomain = ref(false)
const customDomain = ref('shaunandrews.local')
const savedDomain = ref('')
const domainDirty = computed(() => useCustomDomain.value && customDomain.value !== savedDomain.value)

// Admin credentials
const adminUsername = ref('admin')
const adminPassword = ref('pTz8#kL!mQ2xNv')
const adminEmail = ref('admin@localhost.com')
const showPassword = ref(false)

function saveDomain() {
  savedDomain.value = customDomain.value
}

// Debugging
const enableXdebug = ref(false)
const enableDebugLog = ref(false)
const showErrorsInBrowser = ref(false)

// --- Skills ---
const showSkillsModal = ref(false)

const overrides = computed(() => site.value?.skillOverrides ?? {})

function resetSkillOverrides() {
  if (!site.value) return
  updateSite(site.value.id, { skillOverrides: undefined })
}

const overrideEntries = computed(() => {
  return Object.entries(overrides.value).map(([id, state]) => {
    const skill = skills.find(s => s.id === id)
    return { id, state, name: skill?.name ?? id }
  })
})

const phpVersionOptions = [{ label: '', options: ['8.3', '8.2', '8.1', '8.0', '7.4'] }]
const wpVersionOptions = [
  { label: 'Auto-updating', options: ['latest'] },
  { label: 'Beta & Nightly', options: ['nightly', '7.0-beta3'] },
  { label: 'Stable Versions', options: ['6.9.1', '6.9', '6.8', '6.7', '6.6', '6.5', '6.4', '6.3', '6.2'] },
]
</script>

<template>
  <ScreenLayout scrollable>
      <!-- General -->
      <section class="settings__section">
        <h3 class="settings__section-title">General</h3>
        <div class="settings__card settings__card--grouped">
          <div class="settings__group">
            <TextInput
              id="site-name"
              v-model="siteName"
              label="Site name"
            />
            <TextInput
              id="local-path"
              v-model="localPath"
              label="Local path"
              hint="Set when the site is created and cannot be changed."
              disabled
            >
              <template #suffix>
                <Tooltip :text="pathCopied ? 'Copied!' : 'Copy path'" placement="top">
                  <button class="settings__input-action" @click="copyPath">
                    <WPIcon :icon="pathCopied ? checkIcon : copyIcon" :size="20" />
                  </button>
                </Tooltip>
              </template>
            </TextInput>
            <div class="settings__field-row">
              <div class="settings__field">
                <label class="settings__label">PHP version</label>
                <Dropdown
                  v-model="phpVersion"
                  :groups="phpVersionOptions"
                  variant="field"
                  width="fill"
                  menu-surface="dark"
                />
              </div>
              <div class="settings__field">
                <label class="settings__label">WordPress version</label>
                <Dropdown
                  v-model="wpVersion"
                  :groups="wpVersionOptions"
                  variant="field"
                  width="fill"
                  menu-surface="dark"
                  max-height="320px"
                />
              </div>
            </div>
          </div>
          <div class="settings__group">
            <Toggle v-model="useCustomDomain" label="Use a custom domain" hint="Access this site from a nicer URL" />
            <div v-if="useCustomDomain" class="settings__toggle-indent">
              <TextInput
                id="custom-domain"
                v-model="customDomain"
                label="Domain name"
                placeholder="my-site.local"
                hint="You'll be asked for your system password to update."
              >
                <template #suffix>
                  <Tooltip :text="domainCopied ? 'Copied!' : 'Copy domain'" placement="top">
                    <button class="settings__input-action" @click="copyDomain">
                      <WPIcon :icon="domainCopied ? checkIcon : copyIcon" :size="20" />
                    </button>
                  </Tooltip>
                </template>
              </TextInput>
              <div v-if="domainDirty">
                <Button variant="primary" label="Update domain" @click="saveDomain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- wp-admin -->
      <section class="settings__section">
        <h3 class="settings__section-title">wp-admin</h3>
        <div class="settings__card">
          <TextInput
            id="admin-email"
            v-model="adminEmail"
            type="email"
            label="Email"
            placeholder="admin@localhost.com"
          />
          <div class="settings__field-row">
            <TextInput
              id="admin-username"
              v-model="adminUsername"
              label="Username"
            />
            <TextInput
              id="admin-password"
              v-model="adminPassword"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
            >
              <template #suffix>
                <Tooltip :text="showPassword ? 'Hide password' : 'Show password'" placement="top">
                  <button class="settings__input-action" @click="showPassword = !showPassword">
                    <WPIcon :icon="showPassword ? unseenIcon : seenIcon" :size="20" />
                  </button>
                </Tooltip>
              </template>
            </TextInput>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section class="settings__section">
        <h3 class="settings__section-title">Site skills</h3>
        <div class="settings__card" :class="{ 'settings__card--skills-empty': !overrideEntries.length }">
          <div class="skills__content">
            <Text variant="body-small" color="muted">
              Your task agents make use of skills you've installed in <button class="settings__link-btn" @click="emit('manage-global-skills')">Studio Settings</button>.<template v-if="overrideEntries.length"> This site has the following skill overrides:</template><template v-else> You can override global skills for this site.</template>
            </Text>

            <div v-if="overrideEntries.length" class="skills__overrides">
              <Tooltip
                v-for="entry in overrideEntries"
                :key="entry.id"
                :text="entry.state === 'enabled' ? 'Installed on this site' : 'Uninstalled on this site'"
              >
                <span
                  class="skills__override-pill"
                  :class="entry.state === 'enabled' ? 'skills__override-pill--added' : 'skills__override-pill--removed'"
                >
                  {{ entry.name }}
                </span>
              </Tooltip>
            </div>

            <div class="skills__actions">
              <Button variant="secondary" size="small" label="Manage site skills" @click="showSkillsModal = true" />
              <Button v-if="overrideEntries.length" variant="tertiary" size="small" label="Reset to global" @click="resetSkillOverrides" />
            </div>
          </div>

          <!-- Empty state illustration — floating skill pills -->
          <svg v-if="!overrideEntries.length" class="skills__illustration" width="110" height="80" viewBox="0 0 110 80" fill="none" aria-hidden="true">
            <!-- Scattered pills at varying angles, sizes, and opacities -->
            <g transform="rotate(-3 40 14)">
              <rect x="8" y="8" width="40" height="14" rx="7" fill="#b8e6bf" opacity="0.5" />
            </g>
            <g transform="rotate(4 88 12)">
              <rect x="56" y="4" width="32" height="14" rx="7" fill="#f2d76b" opacity="0.35" />
              <line x1="62" y1="11" x2="82" y2="11" stroke="var(--color-frame-fg)" stroke-width="1" opacity="0.15" stroke-linecap="round" />
            </g>
            <g transform="rotate(2 24 36)">
              <rect x="0" y="30" width="34" height="14" rx="7" fill="#f2d76b" opacity="0.3" />
              <line x1="6" y1="37" x2="28" y2="37" stroke="var(--color-frame-fg)" stroke-width="1" opacity="0.12" stroke-linecap="round" />
            </g>
            <g transform="rotate(-2 68 36)">
              <rect x="40" y="28" width="44" height="14" rx="7" fill="#b8e6bf" opacity="0.55" />
            </g>
            <g transform="rotate(5 30 58)">
              <rect x="14" y="52" width="36" height="14" rx="7" fill="#b8e6bf" opacity="0.35" />
            </g>
            <g transform="rotate(-4 82 58)">
              <rect x="58" y="50" width="40" height="14" rx="7" fill="#f2d76b" opacity="0.25" />
              <line x1="64" y1="57" x2="92" y2="57" stroke="var(--color-frame-fg)" stroke-width="1" opacity="0.1" stroke-linecap="round" />
            </g>
          </svg>
        </div>
      </section>

      <!-- Debugging -->
      <section class="settings__section">
        <h3 class="settings__section-title">Debugging</h3>
        <div class="settings__card">
          <Toggle v-model="showErrorsInBrowser" label="Show errors in browsers" size="small" hint="Display PHP errors and warnings directly in the browser by setting the WP_DEBUG_DISPLAY constant." />
          <Toggle v-model="enableDebugLog" label="Debug log" size="small" hint="Log PHP errors and warnings to a debug.log file in your site's wp-content directory by setting the WP_DEBUG_LOG constant." />
          <Toggle v-model="enableXdebug" label="Xdebug" size="small">
            <template #hint>
              Enable PHP debugging with Xdebug. Can only be enabled on one site, and may cause slower performance. <a href="https://developer.wordpress.com/docs/developer-tools/studio/xdebug/" target="_blank" rel="noopener" class="settings__link">Learn more</a>
            </template>
          </Toggle>
        </div>
      </section>

      <SiteSkillsModal :open="showSkillsModal" :site-id="siteId" @close="showSkillsModal = false" />
  </ScreenLayout>
</template>

<style scoped>

/* ── Sections ── */

.settings__section {
  margin-block-end: var(--space-m);
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: clip;
}

.settings__section:last-child {
  margin-block-end: 0;
}

.settings__section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
  padding: var(--space-s) var(--space-m);
}

/* ── Cards ── */

.settings__card {
  background: var(--color-frame-bg);
  border-block-start: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.07);
  padding: var(--space-m);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.settings__card--grouped {
  padding: 0;
  gap: 0;
}

.settings__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
}

.settings__group + .settings__group {
  border-block-start: 1px solid var(--color-frame-border);
}

/* ── Form layout ── */

.settings__field {
  flex: 1;
}

.settings__field-row {
  display: flex;
  gap: var(--space-s);
}

.settings__field-row > .settings__field,
.settings__field-row > .text-input {
  flex: 1;
}

.settings__label {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xs);
}

/* ── Toggle-aligned indent ── */

.settings__toggle-indent {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-inline-start: calc(32px + var(--space-s));
}

/* ── Password visibility toggle ── */

.settings__input-action {
  background: none;
  border: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  padding: var(--space-xxxs);
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-instant) var(--ease-default);
}

.settings__input-action:hover {
  color: var(--color-frame-fg);
}

/* ── Links in hints ── */

.settings__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.settings__link:hover {
  text-decoration: underline;
}

/* ── Skills ── */

.settings__card--skills-empty {
  flex-direction: row;
  align-items: center;
}

.skills__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  flex: 1;
  min-width: 0;
}

.skills__illustration {
  flex-shrink: 0;
  margin-inline-start: var(--space-m);
}

.settings__link-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: var(--color-frame-theme);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.settings__link-btn:hover {
  text-decoration: none;
}

.skills__actions {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.skills__overrides {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxs);
}

.skills__override-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xxxs) var(--space-xs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
}

.skills__override-pill--added {
  background: rgba(184, 230, 191, 0.45);
}

.skills__override-pill--removed {
  background: rgba(242, 215, 107, 0.35);
  text-decoration: line-through;
}

</style>
