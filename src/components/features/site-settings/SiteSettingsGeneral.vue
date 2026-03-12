<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSites } from '@/data/useSites'
import Button from '@/components/primitives/Button.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { copy as copyIcon, check as checkIcon } from '@wordpress/icons'

const props = defineProps<{
  siteId: string
}>()

const { sites, updateSite } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

const siteName = computed({
  get: () => site.value?.name ?? '',
  set: (val: string) => { if (site.value) updateSite(site.value.id, { name: val }) },
})

const localPath = ref('/Users/shaun/Studio/shauns-blog')
const pathCopied = ref(false)
const domainCopied = ref(false)
const phpVersion = ref('8.3')
const wpVersion = ref('latest')
const useCustomDomain = ref(false)
const customDomain = ref('shaunandrews.local')
const savedDomain = ref('')
const domainDirty = computed(() => useCustomDomain.value && customDomain.value !== savedDomain.value)

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

function saveDomain() {
  savedDomain.value = customDomain.value
}

const phpVersionOptions = [{ label: '', options: ['8.3', '8.2', '8.1', '8.0', '7.4'] }]
const wpVersionOptions = [
  { label: 'Auto-updating', options: ['latest'] },
  { label: 'Beta & Nightly', options: ['nightly', '7.0-beta3'] },
  { label: 'Stable Versions', options: ['6.9.1', '6.9', '6.8', '6.7', '6.6', '6.5', '6.4', '6.3', '6.2'] },
]
</script>

<template>
  <section class="settings__section">
    <h3 class="settings__section-title">General</h3>
    <div class="settings__card settings__card--grouped">
      <div class="settings__group">
        <TextInput id="site-name" v-model="siteName" label="Site name" />
        <TextInput id="local-path" v-model="localPath" label="Local path" hint="Set when the site is created and cannot be changed." disabled>
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
            <Dropdown v-model="phpVersion" :groups="phpVersionOptions" variant="field" width="fill" menu-surface="dark" />
          </div>
          <div class="settings__field">
            <label class="settings__label">WordPress version</label>
            <Dropdown v-model="wpVersion" :groups="wpVersionOptions" variant="field" width="fill" menu-surface="dark" max-height="320px" />
          </div>
        </div>
      </div>
      <div class="settings__group">
        <Toggle v-model="useCustomDomain" label="Use a custom domain" hint="Access this site from a nicer URL" />
        <div v-if="useCustomDomain" class="settings__toggle-indent">
          <TextInput id="custom-domain" v-model="customDomain" label="Domain name" placeholder="my-site.local" hint="You'll be asked for your system password to update.">
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
</template>

<style scoped>
.settings__section {
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: clip;
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

.settings__toggle-indent {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-inline-start: calc(32px + var(--space-s));
}

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
</style>
