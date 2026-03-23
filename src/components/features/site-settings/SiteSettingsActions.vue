<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import Modal from '@/components/primitives/Modal.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

defineProps<{
  siteId: string
}>()

const showConfirm = ref(false)

function confirmDelete() {
  showConfirm.value = false
  // Prototype: no actual deletion
}
</script>

<template>
  <SettingsSection title="Danger zone">
    <div class="settings__danger-row">
      <div class="settings__danger-info">
        <Text variant="body-small" weight="semibold">Delete this site</Text>
        <Text variant="body-small" color="muted">Permanently remove this site and all of its data. This action cannot be undone.</Text>
      </div>
      <Button variant="secondary" :destructive="true" label="Delete" @click="showConfirm = true" />
    </div>
  </SettingsSection>

  <Modal :open="showConfirm" title="Delete site" width="400px" @close="showConfirm = false">
    <Text variant="body-small" color="muted">
      Are you sure you want to delete this site? All files, database content, and settings will be permanently removed. This cannot be undone.
    </Text>
    <template #footer>
      <Button variant="secondary" label="Cancel" @click="showConfirm = false" />
      <Button variant="primary" :destructive="true" label="Delete site" @click="confirmDelete" />
    </template>
  </Modal>
</template>

<style scoped>
.settings__danger-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}

.settings__danger-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}
</style>
