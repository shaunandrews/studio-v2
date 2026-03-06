<script setup lang="ts">
import { ref } from 'vue'
import { upload } from '@wordpress/icons'
import WPIcon from '@shared/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'

export interface SelectedFile {
  name: string
  size: number
  type: string
}

const emit = defineEmits<{
  select: [file: SelectedFile]
  clear: []
}>()

const isDragging = ref(false)
const selectedFile = ref<SelectedFile | null>(null)
const error = ref('')

const ACCEPTED_EXTENSIONS = ['.zip', '.gz', '.gzip', '.tar', '.tar.gz', '.wpress']

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function isValidFile(name: string): boolean {
  const lower = name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(ext => lower.endsWith(ext))
}

function handleFile(file: File) {
  error.value = ''
  if (!isValidFile(file.name)) {
    error.value = `Unsupported file type. Please use ${ACCEPTED_EXTENSIONS.join(', ')}.`
    return
  }
  const selected: SelectedFile = { name: file.name, size: file.size, type: file.type }
  selectedFile.value = selected
  emit('select', selected)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onDragOver() { isDragging.value = true }
function onDragLeave() { isDragging.value = false }

function openPicker() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = ACCEPTED_EXTENSIONS.join(',')
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) handleFile(file)
  }
  input.click()
}

function clear() {
  selectedFile.value = null
  error.value = ''
  emit('clear')
}
</script>

<template>
  <div class="import-drop-zone vstack gap-s">
    <div
      v-if="!selectedFile"
      class="drop-area"
      :class="{ 'is-dragging': isDragging }"
      @drop.prevent="onDrop"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @click="openPicker"
    >
      <WPIcon :icon="upload" :size="32" class="drop-icon" />
      <span class="drop-label">Drag and drop a backup file here</span>
      <span class="drop-hint">or click to browse</span>
      <span class="drop-formats">Supports {{ ACCEPTED_EXTENSIONS.join(', ') }}</span>
    </div>

    <div v-else class="selected-file hstack gap-s">
      <div class="file-info vstack gap-xxxs">
        <span class="file-name">{{ selectedFile.name }}</span>
        <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
      </div>
      <Button label="Remove" variant="tertiary" size="small" @click="clear" />
    </div>

    <p v-if="error" class="drop-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.import-drop-zone {
  width: 100%;
}

.drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xxs);
  padding: var(--space-xxxl) var(--space-m);
  border: 2px dashed var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg-secondary);
  cursor: pointer;
  transition:
    border-color var(--transition-hover),
    background var(--transition-hover);
}

.drop-area:hover,
.drop-area.is-dragging {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-frame-bg));
}

.drop-icon {
  color: var(--color-frame-fg-muted);
}

.drop-label {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.drop-hint {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
}

.drop-formats {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  margin-block-start: var(--space-xxs);
}

.selected-file {
  padding: var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg-secondary);
  align-items: center;
  justify-content: space-between;
}

.file-name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.file-size {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
}

.drop-error {
  font-size: var(--font-size-s);
  color: #e65054;
  margin: 0;
}
</style>
