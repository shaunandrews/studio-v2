<script setup lang="ts">
import { injectSiteSettings } from '@/data/useSiteSettings'
import CopyButton from '@/components/primitives/CopyButton.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

defineProps<{
  siteId: string
}>()

const { adminEmail, adminUsername, adminPassword } = injectSiteSettings()
</script>

<template>
  <SettingsSection title="wp-admin">
    <TextInput id="admin-email" v-model="adminEmail" type="email" label="Email" placeholder="admin@localhost.com" />
    <div class="settings__field-row">
      <TextInput id="admin-username" v-model="adminUsername" label="Username" />
      <TextInput id="admin-password" v-model="adminPassword" type="password" label="Password">
        <template #suffix>
          <CopyButton :text="adminPassword" label="Copy password" />
        </template>
      </TextInput>
    </div>
  </SettingsSection>
</template>

<style scoped>
.settings__field-row {
  display: flex;
  gap: var(--space-s);
}

.settings__field-row > .text-input {
  flex: 1;
}
</style>
