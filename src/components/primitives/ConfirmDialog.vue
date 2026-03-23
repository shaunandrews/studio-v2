<script setup lang="ts">
import { useConfirm } from '@/data/useConfirm'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'

const { visible, options, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <Modal :open="visible" :title="options.title" :closable="false" width="400px" @close="handleCancel">
    <Text variant="body" color="muted">{{ options.message }}</Text>
    <template #footer>
      <Button
        variant="secondary"
        :label="options.cancelLabel || 'Cancel'"
        @click="handleCancel"
      />
      <Button
        variant="primary"
        :destructive="options.destructive"
        :label="options.confirmLabel || 'Confirm'"
        @click="handleConfirm"
      />
    </template>
  </Modal>
</template>
