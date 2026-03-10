<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSites } from '@/data/useSites'
import Dropdown from '@/components/primitives/Dropdown.vue'
import TextInput from '@/components/primitives/TextInput.vue'
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
const wpVersionOptions = [{ label: '', options: ['latest', '6.9.1', '6.8', '6.7', '6.6'] }]
</script>

<template>
  <ScreenLayout scrollable>
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
            :show-chevron="true"
          />
        </div>
        <div class="settings__field">
          <label class="settings__label">WordPress version</label>
          <Dropdown
            v-model="wpVersion"
            :groups="wpVersionOptions"
            variant="field"
            width="fill"
            :show-chevron="true"
          />
        </div>
      </div>

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

      <!-- Toggles -->
      <div class="settings__toggles">
        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="useCustomDomain" class="settings__checkbox" />
            Use custom domain
          </label>
        </div>

        <template v-if="useCustomDomain">
          <div class="settings__field settings__field--indented">
            <TextInput
              id="custom-domain"
              v-model="customDomain"
              label="Domain name"
              placeholder="my-site.wp.local"
              hint="Your system password will be required to set up the domain."
            />
          </div>
        </template>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="enableHttps" class="settings__checkbox" />
            Enable HTTPS
          </label>
          <p class="settings__hint">Requires trusting the Studio certificate authority in your keychain. <a href="#" class="settings__link" @click.prevent>Learn how</a></p>
        </div>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="enableXdebug" class="settings__checkbox" />
            Enable Xdebug
          </label>
          <p class="settings__hint">Only one site at a time. May slow down performance.</p>
        </div>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="enableDebugLog" class="settings__checkbox" />
            Enable debug log
          </label>
        </div>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="showErrorsInBrowser" class="settings__checkbox" />
            Show errors in browser
          </label>
        </div>
      </div>

  </ScreenLayout>
</template>

<style scoped>

/* ── Form layout ── */

.settings__field {
  margin-block-end: var(--space-s);
}

.settings__field--indented {
  padding-inline-start: var(--space-l);
}

.settings__field-row {
  display: flex;
  gap: var(--space-s);
  margin-block-end: var(--space-s);
}

.settings__field-row > .settings__field {
  flex: 1;
  margin-block-end: 0;
}

.settings__field-row > .text-input {
  flex: 1;
}

.text-input {
  margin-block-end: var(--space-s);
}

.settings__field-row > .text-input {
  margin-block-end: 0;
}

.settings__label {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xxs);
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

/* ── Checkbox fields ── */

.settings__toggles {
  margin-block-start: var(--space-m);
}

.settings__checkbox-field {
  margin-block-end: var(--space-s);
}

.settings__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  cursor: pointer;
}

.settings__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-frame-theme);
  cursor: pointer;
  flex-shrink: 0;
}

.settings__hint {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  margin: var(--space-xxxs) 0 0;
  line-height: 1.5;
}

.settings__checkbox-field .settings__hint {
  padding-inline-start: calc(16px + var(--space-xxs));
}

.settings__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.settings__link:hover {
  text-decoration: underline;
}

</style>
