<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { chevronDown, chevronUp } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'

const props = defineProps<{
  /** Pre-fill the site name (e.g. from a pulled remote site) */
  initialName?: string
  /** Label for the submit button */
  submitLabel?: string
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

const nameRef = ref<HTMLInputElement | null>(null)
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

/** Derive a default domain from the site name */
const derivedDomain = computed(() => {
  const slug = siteName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug ? `${slug}.wp.local` : ''
})

const displayDomain = computed(() => customDomain.value || derivedDomain.value)

const defaultBasePath = '/Users/shaun/Studio'

/** Derive a slug from the site name for the default local path */
const derivedPath = computed(() => {
  const slug = siteName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug ? `${defaultBasePath}/${slug}` : ''
})

/** Show the user-edited path, or fall back to the auto-derived one */
const displayPath = computed(() => localPath.value || derivedPath.value)

const canSubmit = computed(() => siteName.value.trim().length > 0 && !props.submitDisabled)

watch(() => props.initialName, (v) => {
  if (v) siteName.value = v
})

onMounted(() => {
  nameRef.value?.focus()
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
</script>

<template>
  <div class="site-details-form vstack gap-m">
    <div class="field vstack gap-xxs">
      <label class="field-label" for="site-name">Site name</label>
      <input
        id="site-name"
        ref="nameRef"
        v-model="siteName"
        class="field-input"
        type="text"
        placeholder="My WordPress Site"
        @keydown.enter="submit"
      />
    </div>

    <div class="form-actions hstack">
      <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
        <WPIcon :icon="showAdvanced ? chevronUp : chevronDown" :size="20" />
        <span>Advanced settings</span>
      </button>
      <Button
        :label="submitLabel ?? 'Create site'"
        variant="primary"
        surface="dark"
        :disabled="!canSubmit"
        @click="submit"
      />
    </div>

    <div v-if="showAdvanced" class="advanced-fields vstack gap-m">
      <div class="field vstack gap-xxxs">
        <label class="field-label" for="local-path">Local path</label>
        <p class="field-hint">Select an empty directory or a directory with an existing WordPress site.</p>
        <div class="path-input-wrapper">
          <input
            id="local-path"
            :value="displayPath"
            class="field-input path-input"
            type="text"
            placeholder="/Users/shaun/Studio/my-site"
            @input="localPath = ($event.target as HTMLInputElement).value"
          />
          <button class="path-browse-btn" title="Browse…">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div class="version-row hstack gap-s">
        <div class="field vstack gap-xxs" style="flex: 1;">
          <label class="field-label" for="php-version">PHP version</label>
          <select id="php-version" v-model="phpVersion" class="field-select">
            <option value="8.3">8.3</option>
            <option value="8.2">8.2</option>
            <option value="8.1">8.1</option>
            <option value="8.0">8.0</option>
          </select>
        </div>
        <div class="field vstack gap-xxs" style="flex: 1;">
          <label class="field-label" for="wp-version">WordPress version</label>
          <select id="wp-version" v-model="wpVersion" class="field-select">
            <option value="latest">latest</option>
            <option value="6.7">6.7</option>
            <option value="6.6">6.6</option>
            <option value="6.5">6.5</option>
          </select>
        </div>
      </div>

      <div class="field vstack gap-xxs">
        <span class="field-label field-label--section">Admin credentials</span>
        <div class="version-row hstack gap-s">
          <div class="field vstack gap-xxs" style="flex: 1;">
            <label class="field-label" for="admin-username">Username</label>
            <input
              id="admin-username"
              v-model="adminUsername"
              class="field-input"
              type="text"
            />
          </div>
          <div class="field vstack gap-xxs" style="flex: 1;">
            <label class="field-label" for="admin-password">Password</label>
            <div class="password-input-wrapper">
              <input
                id="admin-password"
                v-model="adminPassword"
                class="field-input password-input"
                :type="showPassword ? 'text' : 'password'"
              />
              <button
                class="password-toggle-btn"
                :title="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="field vstack gap-xxs">
        <label class="field-label" for="admin-email">Email</label>
        <input
          id="admin-email"
          v-model="adminEmail"
          class="field-input"
          type="email"
          placeholder="admin@localhost.com"
        />
        <p class="field-hint">Defaults to admin@localhost.com if not provided.</p>
      </div>

      <div class="custom-domain-section vstack gap-s">
        <label class="custom-domain-toggle hstack gap-xxs">
          <input
            v-model="useCustomDomain"
            type="checkbox"
            class="field-checkbox"
          />
          <span>Use custom domain</span>
        </label>

        <template v-if="useCustomDomain">
          <p class="field-hint">Your system password will be required to set up the domain.</p>

          <div class="field vstack gap-xxs">
            <label class="field-label" for="custom-domain">Domain name</label>
            <input
              id="custom-domain"
              :value="displayDomain"
              class="field-input"
              type="text"
              placeholder="my-site.wp.local"
              @input="customDomain = ($event.target as HTMLInputElement).value"
            />
          </div>

          <label class="custom-domain-toggle hstack gap-xxs">
            <input
              v-model="enableHttps"
              type="checkbox"
              class="field-checkbox"
            />
            <span>Enable HTTPS</span>
          </label>
          <p class="field-hint">You need to manually add the Studio root certificate authority to your keychain and trust it to enable HTTPS. <a href="#" class="field-link">Learn how</a></p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.site-details-form {
  width: 100%;
  max-width: 400px;
}

.field-label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-chrome-fg-muted);
}

.field-input,
.field-select {
  height: 40px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-s);
  background: var(--color-chrome-fill);
  color: var(--color-chrome-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
  outline: none;
  transition: border-color var(--transition-hover);
}

.field-input:focus,
.field-select:focus {
  border-color: var(--color-chrome-theme);
  box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

.field-input::placeholder {
  color: var(--color-chrome-fg-muted);
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

.form-actions {
  justify-content: space-between;
  align-items: center;
}

.field-hint {
  font-size: var(--font-size-xs);
  color: var(--color-chrome-fg-muted);
  margin: 0;
  line-height: 1.4;
}

.path-input-wrapper {
  position: relative;
  display: flex;
}

.path-input {
  flex: 1;
  padding-inline-end: 40px;
}

.path-browse-btn {
  position: absolute;
  inset-inline-end: 0;
  inset-block-start: 0;
  height: 100%;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  transition: color var(--transition-hover);
}

.path-browse-btn:hover {
  color: var(--color-chrome-fg);
}

.field-label--section {
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

.password-input-wrapper {
  position: relative;
  display: flex;
}

.password-input {
  flex: 1;
  padding-inline-end: 36px;
}

.password-toggle-btn {
  position: absolute;
  inset-inline-end: 0;
  inset-block-start: 0;
  height: 100%;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  transition: color var(--transition-hover);
}

.password-toggle-btn:hover {
  color: var(--color-chrome-fg);
}

.custom-domain-toggle {
  align-items: center;
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg);
  cursor: pointer;
}

.field-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-chrome-theme);
  cursor: pointer;
}

.field-link {
  color: var(--color-chrome-theme);
  text-decoration: none;
}

.field-link:hover {
  text-decoration: underline;
}
</style>
