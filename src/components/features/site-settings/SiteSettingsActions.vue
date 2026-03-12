<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import Modal from '@/components/primitives/Modal.vue'
import { trash } from '@wordpress/icons'

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
  <section class="settings__section">
    <h3 class="settings__section-title">Danger zone</h3>
    <div class="settings__card">
      <div class="settings__danger-row">
        <div class="settings__danger-info">
          <Text variant="body-small" weight="semibold">Delete this site</Text>
          <Text variant="body-small" color="muted">Permanently remove this site and all of its data. This action cannot be undone.</Text>
        </div>
        <Button variant="secondary" :destructive="true" label="Delete" @click="showConfirm = true" />
      </div>
    </div>
  </section>

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
}

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
