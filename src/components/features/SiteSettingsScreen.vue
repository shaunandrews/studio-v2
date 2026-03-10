<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSites } from '@/data/useSites'
import Dropdown from '@/components/primitives/Dropdown.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import { seen as seenIcon, unseen as unseenIcon } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = defineProps<{
  siteId: string
}>()

const { sites, updateSite } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

// --- Site settings mock state ---
const siteName = computed({
  get: () => site.value?.name ?? '',
  set: (val: string) => { if (site.value) updateSite(site.value.id, { name: val }) },
})
const phpVersion = ref('8.3')
const wpVersion = ref('latest')
const useCustomDomain = ref(false)
const customDomain = ref('downstreet-cafe.wp.local')
const enableHttps = ref(false)

// Admin credentials
const adminUsername = ref('admin')
const adminPassword = ref('pTz8#kL!mQ2xNv')
const adminEmail = ref('admin@localhost.com')
const showPassword = ref(false)

// Debugging
const enableXdebug = ref(false)
const enableDebugLog = ref(false)
const showErrorsInBrowser = ref(false)

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
        <div class="settings__card">
          <TextInput
            id="site-name"
            v-model="siteName"
            label="Site name"
          />
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
      </section>

      <!-- Admin credentials -->
      <section class="settings__section">
        <h3 class="settings__section-title">Admin credentials</h3>
        <div class="settings__card">
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
                <button class="settings__input-action" @click="showPassword = !showPassword">
                  <WPIcon :icon="showPassword ? unseenIcon : seenIcon" :size="20" />
                </button>
              </template>
            </TextInput>
          </div>
          <TextInput
            id="admin-email"
            v-model="adminEmail"
            type="email"
            label="Email"
            placeholder="admin@localhost.com"
            hint="Defaults to admin@localhost.com if not provided."
          />
        </div>
      </section>

      <!-- Network -->
      <section class="settings__section">
        <h3 class="settings__section-title">Network</h3>
        <div class="settings__card">
          <Toggle v-model="useCustomDomain" label="Custom domain" size="small" />

          <template v-if="useCustomDomain">
            <TextInput
              id="custom-domain"
              v-model="customDomain"
              label="Domain name"
              placeholder="my-site.wp.local"
              hint="Your system password will be required to set up the domain."
            />
          </template>

          <Toggle
            v-if="useCustomDomain"
            v-model="enableHttps"
            label="HTTPS"
            size="small"
          >
            <template #hint>
              You need to manually add the Studio certificate authority to your keychain and trust it. <a href="https://developer.wordpress.com/docs/developer-tools/studio/ssl-in-studio/" target="_blank" rel="noopener" class="settings__link">Learn how</a>
            </template>
          </Toggle>
        </div>
      </section>

      <!-- Debugging -->
      <section class="settings__section">
        <h3 class="settings__section-title">Debugging</h3>
        <div class="settings__card">
          <Toggle v-model="enableXdebug" label="Xdebug" size="small">
            <template #hint>
              Enable PHP debugging with Xdebug. Only one site can have Xdebug enabled at a time. Note that Xdebug may slow down site performance. <a href="https://developer.wordpress.com/docs/developer-tools/studio/xdebug/" target="_blank" rel="noopener" class="settings__link">Learn more</a>
            </template>
          </Toggle>
          <Toggle v-model="enableDebugLog" label="Debug log" size="small" hint="Log PHP errors and warnings to a debug.log file in your site's wp-content directory by setting the WP_DEBUG_LOG constant." />
          <Toggle v-model="showErrorsInBrowser" label="Show errors in browser" size="small" hint="Display PHP errors and warnings directly in the browser by setting the WP_DEBUG_DISPLAY constant." />
        </div>
      </section>
  </ScreenLayout>
</template>

<style scoped>

/* ── Sections ── */

.settings__section {
  margin-block-end: var(--space-l);
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
  margin: 0 0 var(--space-s);
}

/* ── Cards ── */

.settings__card {
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  padding: var(--space-m);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
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

</style>
