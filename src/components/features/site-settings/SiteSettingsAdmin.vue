<script setup lang="ts">
import { ref } from 'vue'
import TextInput from '@/components/primitives/TextInput.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { copy as copyIcon, check as checkIcon } from '@wordpress/icons'

defineProps<{
  siteId: string
}>()

const adminUsername = ref('admin')
const adminPassword = ref('pTz8#kL!mQ2xNv')
const adminEmail = ref('admin@localhost.com')
const passwordCopied = ref(false)

function copyPassword() {
  navigator.clipboard.writeText(adminPassword.value)
  passwordCopied.value = true
  setTimeout(() => { passwordCopied.value = false }, 1500)
}
</script>

<template>
  <section class="settings__section">
    <h3 class="settings__section-title">wp-admin</h3>
    <div class="settings__card">
      <TextInput id="admin-email" v-model="adminEmail" type="email" label="Email" placeholder="admin@localhost.com" />
      <div class="settings__field-row">
        <TextInput id="admin-username" v-model="adminUsername" label="Username" />
        <TextInput id="admin-password" v-model="adminPassword" type="password" label="Password">
          <template #suffix>
            <Tooltip :text="passwordCopied ? 'Copied!' : 'Copy password'" placement="top">
              <button class="settings__input-action" @click="copyPassword">
                <WPIcon :icon="passwordCopied ? checkIcon : copyIcon" :size="20" />
              </button>
            </Tooltip>
          </template>
        </TextInput>
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

.settings__field-row {
  display: flex;
  gap: var(--space-s);
}

.settings__field-row > .text-input {
  flex: 1;
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
