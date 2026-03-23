<script setup lang="ts">
import { ref } from 'vue'
import { injectSiteSettings } from '@/data/useSiteSettings'
import CopyButton from '@/components/primitives/CopyButton.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import Checkbox from '@/components/primitives/Checkbox.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

defineProps<{
  siteId: string
}>()

const localPath = ref('/Users/shaun/Studio/shauns-blog')

const { name: siteName, phpVersion, wpVersion, useCustomDomain, customDomain } = injectSiteSettings()

const phpVersionOptions = [{ label: '', options: ['8.3', '8.2', '8.1', '8.0', '7.4'] }]
const wpVersionOptions = [
  { label: 'Auto-updating', options: ['latest'] },
  { label: 'Beta & Nightly', options: ['nightly', '7.0-beta3'] },
  { label: 'Stable Versions', options: ['6.9.1', '6.9', '6.8', '6.7', '6.6', '6.5', '6.4', '6.3', '6.2'] },
]
</script>

<template>
  <SettingsSection title="General" grouped>
      <div class="settings__group">
        <TextInput id="site-name" v-model="siteName" label="Site name" />
        <TextInput id="local-path" v-model="localPath" label="Local path" hint="Set when the site is created and cannot be changed." disabled>
          <template #suffix>
            <CopyButton :text="localPath" label="Copy path" />
          </template>
        </TextInput>
        <div class="settings__field-row">
          <div class="settings__field">
            <label class="settings__label">PHP version</label>
            <Dropdown v-model="phpVersion" :groups="phpVersionOptions" variant="field" width="fill" menu-surface="dark" />
          </div>
          <div class="settings__field">
            <label class="settings__label">WordPress version</label>
            <Dropdown v-model="wpVersion" :groups="wpVersionOptions" variant="field" width="fill" menu-surface="dark" max-height="320px" />
          </div>
        </div>
      </div>
      <div class="settings__group">
        <Checkbox v-model="useCustomDomain" label="Use a custom domain" hint="Access this site from a nicer URL" />
        <div v-if="useCustomDomain" class="settings__checkbox-indent">
          <TextInput id="custom-domain" v-model="customDomain" label="Domain name" placeholder="my-site.local" hint="You'll be asked for your system password to update.">
            <template #suffix>
              <CopyButton :text="customDomain" label="Copy domain" />
            </template>
          </TextInput>
        </div>
      </div>
  </SettingsSection>
</template>

<style scoped>
.settings__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
}

.settings__group + .settings__group {
  border-block-start: 1px solid var(--color-frame-border);
}

.settings__field { flex: 1; }

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

.settings__checkbox-indent {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-inline-start: calc(16px + var(--space-s));
}

</style>
