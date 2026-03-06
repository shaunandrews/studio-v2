<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { chevronDown, chevronUp } from '@wordpress/icons'
import WPIcon from '@shared/primitives/WPIcon.vue'
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
  submit: [data: { name: string; phpVersion: string; wpVersion: string }]
}>()

const nameRef = ref<HTMLInputElement | null>(null)
const siteName = ref(props.initialName ?? '')
const showAdvanced = ref(false)
const phpVersion = ref('8.3')
const wpVersion = ref('latest')

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
    phpVersion: phpVersion.value,
    wpVersion: wpVersion.value,
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

    <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
      <WPIcon :icon="showAdvanced ? chevronUp : chevronDown" :size="20" />
      <span>Advanced settings</span>
    </button>

    <div v-if="showAdvanced" class="advanced-fields vstack gap-m">
      <div class="field vstack gap-xxs">
        <label class="field-label" for="php-version">PHP version</label>
        <select id="php-version" v-model="phpVersion" class="field-select">
          <option value="8.3">PHP 8.3</option>
          <option value="8.2">PHP 8.2</option>
          <option value="8.1">PHP 8.1</option>
          <option value="8.0">PHP 8.0</option>
        </select>
      </div>
      <div class="field vstack gap-xxs">
        <label class="field-label" for="wp-version">WordPress version</label>
        <select id="wp-version" v-model="wpVersion" class="field-select">
          <option value="latest">Latest</option>
          <option value="6.7">6.7</option>
          <option value="6.6">6.6</option>
          <option value="6.5">6.5</option>
        </select>
      </div>
    </div>

    <div class="form-footer">
      <Button
        :label="submitLabel ?? 'Create site'"
        variant="primary"
        :disabled="!canSubmit"
        width="full"
        @click="submit"
      />
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
  color: var(--color-frame-fg-secondary);
}

.field-input,
.field-select {
  height: 40px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
  outline: none;
  transition: border-color var(--transition-hover);
}

.field-input:focus,
.field-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.field-input::placeholder {
  color: var(--color-frame-fg-muted);
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
  color: var(--color-frame-fg-secondary);
  cursor: pointer;
  transition: color var(--transition-hover);
}

.advanced-toggle:hover {
  color: var(--color-frame-fg);
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

.form-footer {
  justify-content: flex-end;
  padding-block-start: var(--space-xs);
}
</style>
