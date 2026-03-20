<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { chevronDown, chevronUp, seen as seenIcon, unseen as unseenIcon } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = defineProps<{
  /** Pre-fill the site name (e.g. from a pulled remote site) */
  initialName?: string
  /** Disable submit externally (e.g. while importing) */
  submitDisabled?: boolean
}>()

const emit = defineEmits<{
  submit: [data: {
    name: string
    localPath: string
    phpVersion: string
    wpVersion: string
    adminUsername: string
    adminPassword: string
    adminEmail: string
    useCustomDomain: boolean
    customDomain: string
    enableHttps: boolean
  }]
}>()

const siteName = ref(props.initialName ?? '')
const showAdvanced = ref(false)
const localPath = ref('')
const phpVersion = ref('8.3')
const wpVersion = ref('latest')
const adminUsername = ref('admin')
const adminPassword = ref('password')
const showPassword = ref(false)
const adminEmail = ref('')
const useCustomDomain = ref(false)
const customDomain = ref('')
const enableHttps = ref(false)

const defaultBasePath = '/Users/shaun/Studio'

/** Derive a slug from the site name */
function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Derive a default local path from the site name */
const derivedPath = computed(() => {
  const slug = slugify(siteName.value)
  return slug ? `${defaultBasePath}/${slug}` : ''
})

/** Show the user-edited path, or fall back to the auto-derived one */
const displayPath = computed({
  get: () => localPath.value || derivedPath.value,
  set: (val: string) => { localPath.value = val },
})

/** Derive a default domain from the site name */
const derivedDomain = computed(() => {
  const slug = slugify(siteName.value)
  return slug ? `${slug}.wp.local` : ''
})

const displayDomain = computed({
  get: () => customDomain.value || derivedDomain.value,
  set: (val: string) => { customDomain.value = val },
})

const canSubmit = computed(() => siteName.value.trim().length > 0 && !props.submitDisabled)

const phpVersionOptions = [{ label: '', options: ['8.3', '8.2', '8.1', '8.0'] }]
const wpVersionOptions = [{ label: '', options: ['latest', '6.7', '6.6', '6.5'] }]

watch(() => props.initialName, (v) => {
  if (v) siteName.value = v
})

onMounted(() => {
  // Focus the site name field on mount
  const el = document.getElementById('site-name')
  if (el instanceof HTMLInputElement) el.focus()
})

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    name: siteName.value.trim(),
    localPath: displayPath.value,
    phpVersion: phpVersion.value,
    wpVersion: wpVersion.value,
    adminUsername: adminUsername.value,
    adminPassword: adminPassword.value,
    adminEmail: adminEmail.value,
    useCustomDomain: useCustomDomain.value,
    customDomain: useCustomDomain.value ? displayDomain.value : '',
    enableHttps: enableHttps.value,
  })
}

defineExpose({ submit, canSubmit })
</script>

<template>
  <div class="site-details-form vstack gap-m">
    <TextInput
      id="site-name"
      v-model="siteName"
      label="Site name"
      placeholder="My WordPress Site"
      surface="dark"
      @keydown.enter="submit"
    />

    <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
      <WPIcon :icon="showAdvanced ? chevronUp : chevronDown" :size="20" />
      <span>Advanced settings</span>
    </button>

    <div v-if="showAdvanced" class="advanced-fields vstack gap-m">
      <TextInput
        id="local-path"
        v-model="displayPath"
        label="Local path"
        placeholder="/Users/shaun/Studio/my-site"
        surface="dark"
      >
        <template #hint>
          Select an empty directory or a directory with an existing WordPress site. <a href="#" class="form-link">Learn more</a>
        </template>
        <template #suffix>
          <Tooltip text="Browse…" placement="top">
            <button class="form-input-action" title="Browse…">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </Tooltip>
        </template>
      </TextInput>

      <div class="form-field-row">
        <div class="form-field">
          <label class="form-label">PHP version</label>
          <Dropdown
            v-model="phpVersion"
            :groups="phpVersionOptions"
            variant="field"
            width="fill"
            surface="dark"
          />
        </div>
        <div class="form-field">
          <label class="form-label">WordPress version</label>
          <Dropdown
            v-model="wpVersion"
            :groups="wpVersionOptions"
            variant="field"
            width="fill"
            surface="dark"
          />
        </div>
      </div>

      <div class="vstack gap-xxs">
        <span class="form-section-label">Admin credentials</span>
        <div class="form-field-row">
          <TextInput
            id="admin-username"
            v-model="adminUsername"
            label="Username"
            surface="dark"
          />
          <TextInput
            id="admin-password"
            v-model="adminPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            surface="dark"
          >
            <template #suffix>
              <Tooltip :text="showPassword ? 'Hide password' : 'Show password'" placement="top">
                <button class="form-input-action" @click="showPassword = !showPassword">
                  <WPIcon :icon="showPassword ? unseenIcon : seenIcon" :size="20" />
                </button>
              </Tooltip>
            </template>
          </TextInput>
        </div>
      </div>

      <TextInput
        id="admin-email"
        v-model="adminEmail"
        type="email"
        label="Email"
        placeholder="admin@localhost.com"
        hint="Defaults to admin@localhost.com if not provided."
        surface="dark"
      />

      <Toggle v-model="useCustomDomain" label="Use custom domain" surface="dark">
        <template #hint>Your system password will be required to set up the domain.</template>
      </Toggle>

      <template v-if="useCustomDomain">
        <TextInput
          id="custom-domain"
          v-model="displayDomain"
          label="Domain name"
          placeholder="my-site.wp.local"
          surface="dark"
        />

        <Toggle v-model="enableHttps" label="Enable HTTPS" surface="dark">
          <template #hint>
            You need to manually add the Studio root certificate authority to your keychain and trust it to enable HTTPS. <a href="#" class="form-link">Learn how</a>
          </template>
        </Toggle>
      </template>
    </div>
  </div>
</template>

<style scoped>
.site-details-form {
  width: 100%;
  max-width: 400px;
}

.advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxxs);
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  transition: color var(--transition-hover);
}

.advanced-toggle:hover {
  color: var(--color-chrome-fg);
}

.advanced-fields {
  animation: fields-in 200ms var(--ease-out) both;
}

@keyframes fields-in {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
}

/* ── Form layout ── */

.form-field-row {
  display: flex;
  gap: var(--space-s);
}

.form-field-row > .form-field,
.form-field-row > :deep(.text-input) {
  flex: 1;
}

.form-field {
  flex: 1;
}

.form-label {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
  margin-block-end: var(--space-xs);
}

.form-section-label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

/* ── Input suffix actions ── */

.form-input-action {
  background: none;
  border: none;
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  padding: var(--space-xxxs);
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-instant) var(--ease-default);
}

.form-input-action:hover {
  color: var(--color-chrome-fg);
}

/* ── Links in hints ── */

.form-link {
  color: var(--color-chrome-theme);
  text-decoration: none;
}

.form-link:hover {
  text-decoration: underline;
}
</style>
