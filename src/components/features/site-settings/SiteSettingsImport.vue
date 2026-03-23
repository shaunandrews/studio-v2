<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useImportExport } from '@/data/useImportExport'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

const props = defineProps<{
  siteId: string
}>()

const {
  importState,
  isConfirming,
  isImporting,
  isExporting,
  isImportDone,
  isValidFile,
  startImport,
  confirmImport,
  cancelImport,
  clearImport,
  formatFileSize,
  ACCEPTED_FILE_TYPES,
  IMPORT_STAGES,
} = useImportExport(toRef(props, 'siteId'))

// --- File extensions for pills ---
const fileExtensions = computed(() => {
  const exts = [...new Set(ACCEPTED_FILE_TYPES.map(t => t.replace(/^\./, '')))]
  return exts.map((ext) => ({
    ext: `.${ext}`,
    delay: (Math.random() * 2).toFixed(2),
  }))
})

// --- Drag and drop ---
const isDragging = ref(false)
const fileError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  if (isImporting.value || isConfirming.value) return
  isDragging.value = true
  fileError.value = null
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDragLeave(e: DragEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  if (
    e.clientX <= rect.left ||
    e.clientX >= rect.right ||
    e.clientY <= rect.top ||
    e.clientY >= rect.bottom
  ) {
    isDragging.value = false
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (isImporting.value || isExporting.value || isConfirming.value) return

  const file = e.dataTransfer?.files[0]
  if (!file) return

  if (!isValidFile(file.name)) {
    fileError.value = 'Unsupported file type. Use .zip, .gz, .tar, .tar.gz, .wpress, or .sql.'
    return
  }

  fileError.value = null
  startImport(file.name, file.size)
}

function openFileSelector() {
  if (isImporting.value || isExporting.value || isConfirming.value) return
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!isValidFile(file.name)) {
    fileError.value = 'Unsupported file type. Use .zip, .gz, .tar, .tar.gz, .wpress, or .sql.'
    input.value = ''
    return
  }

  fileError.value = null
  startImport(file.name, file.size)
  input.value = ''
}

function handleImportAnother() {
  clearImport()
  fileError.value = null
}

// --- Truncated filename ---
function truncateFilename(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name
  const ext = name.lastIndexOf('.')
  if (ext === -1) return name.slice(0, maxLen - 3) + '...'
  const extStr = name.slice(ext)
  const base = name.slice(0, ext)
  const available = maxLen - extStr.length - 3
  if (available < 4) return name.slice(0, maxLen - 3) + '...'
  return base.slice(0, available) + '...' + extStr
}

const importDisabled = computed(() => isImporting.value || isExporting.value || isConfirming.value)

const importStateKey = computed(() => {
  if (isImportDone.value) return 'done'
  if (isImporting.value) return 'importing'
  if (isConfirming.value) return 'confirming'
  return 'idle'
})
</script>

<template>
  <SettingsSection title="Import">
    <Text variant="body-small" color="muted">Restore a site from a backup or migrate from another host.</Text>
    <div
      class="ie__dropzone"
      :class="{
        'is-dragging': isDragging,
        'is-active': isConfirming || isImporting || isImportDone,
      }"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <Transition name="ie-fade" mode="out-in">
        <!-- Idle state -->
        <div v-if="importStateKey === 'idle'" key="idle" class="ie__dropzone-idle">
          <div class="ie__pills">
            <span
              v-for="item in fileExtensions"
              :key="item.ext"
              class="ie__pill"
              :style="{ '--delay': item.delay + 's' }"
            >{{ item.ext }}</span>
          </div>
          <Button
            variant="secondary"
            label="Choose file..."
            :disabled="importDisabled"
            @click="openFileSelector"
          />
          <Text variant="body-small" color="muted">or drag a file anywhere</Text>
        </div>

        <!-- Confirm state -->
        <div v-else-if="importStateKey === 'confirming'" key="confirming" class="ie__confirm">
          <div class="ie__file-pill">
            <svg class="ie__file-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 1h5l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" fill="none" />
              <path d="M9 1v4h4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none" />
            </svg>
            <span class="ie__file-name">{{ truncateFilename(importState?.fileName ?? '') }}</span>
            <span class="ie__file-sep">&mdash;</span>
            <span class="ie__file-size">{{ formatFileSize(importState?.fileSize ?? 0) }}</span>
          </div>
          <Text variant="body-small" color="muted">This will replace the current site.</Text>
          <div class="ie__confirm-actions">
            <Button variant="primary" label="Import" @click="confirmImport" />
            <Button variant="tertiary" label="Cancel" @click="cancelImport" />
          </div>
        </div>

        <!-- Importing state -->
        <div v-else-if="importStateKey === 'importing'" key="importing" class="ie__stepper-wrap">
          <div class="ie__stepper">
            <div
              v-for="(stage, i) in IMPORT_STAGES"
              :key="stage.key"
              class="ie__step"
              :class="{
                'is-done': i < (importState?.currentStage ?? 0),
                'is-active': i === (importState?.currentStage ?? 0),
                'is-pending': i > (importState?.currentStage ?? 0),
                'is-last': i === IMPORT_STAGES.length - 1,
              }"
            >
              <div class="ie__step-dot">
                <svg v-if="i < (importState?.currentStage ?? 0)" class="ie__step-check" viewBox="0 0 12 12" width="12" height="12">
                  <path d="M3 6 L5.5 8.5 L9 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                </svg>
              </div>
              <span class="ie__step-label">{{ stage.label }}</span>
            </div>
          </div>
          <Text variant="body-small" color="muted">{{ importState?.statusMessage ?? 'Importing...' }}</Text>
        </div>

        <!-- Done state -->
        <div v-else-if="importStateKey === 'done'" key="done" class="ie__done">
          <svg class="ie__checkmark" viewBox="0 0 36 36" width="36" height="36">
            <circle cx="18" cy="18" r="16" />
            <path d="M11 18 L16 23 L25 13" />
          </svg>
          <Text variant="body" weight="medium">Import complete!</Text>
          <div class="ie__done-actions">
            <Button variant="primary" label="Open site" @click.stop />
            <button class="ie__text-btn" @click="handleImportAnother">Import another</button>
          </div>
        </div>
      </Transition>

      <!-- Drag overlay -->
      <Transition name="ie-overlay">
        <div v-if="isDragging" class="ie__drag-overlay">
          <div class="ie__drag-overlay-content">
            <svg class="ie__drag-arrow" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4 L14 20 M7 13 L14 20 L21 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <Text variant="body" weight="medium" color="inherit">Drop file to import</Text>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Error display -->
    <div v-if="fileError" class="ie__error">
      <Text variant="body-small" color="muted">{{ fileError }}</Text>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="ACCEPTED_FILE_TYPES.join(',')"
      class="ie__file-input"
      @change="onFileSelected"
    />
  </SettingsSection>
</template>

<style scoped>
/* ── Drop Zone ── */

.ie__dropzone {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1.5px dashed var(--color-frame-border);
  border-radius: var(--radius-m);
  padding: var(--space-xxl) var(--space-m);
  transition: border-color var(--duration-moderate) var(--ease-default),
              background var(--duration-moderate) var(--ease-default);
}

.ie__dropzone:hover:not(.is-active) {
  border-color: var(--color-frame-theme);
}

.ie__dropzone.is-dragging {
  border-color: var(--color-frame-theme);
  background: color-mix(in srgb, var(--color-frame-theme) 4%, transparent);
  animation: ie-border-pulse 1.2s var(--ease-in-out) infinite;
}

.ie__dropzone.is-active {
  border-style: solid;
  border-color: var(--color-frame-border);
}

@keyframes ie-border-pulse {
  0%, 100% { border-color: var(--color-frame-theme); }
  50% { border-color: color-mix(in srgb, var(--color-frame-theme) 40%, transparent); }
}

/* ── Drop Zone Idle ── */

.ie__dropzone-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-s);
}

/* ── Floating Pills ── */

.ie__pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-xs);
  padding-block-end: var(--space-xxs);
}

.ie__pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xxs) var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  background: var(--color-frame-hover);
  border-radius: var(--radius-m);
  animation: ie-pill-drift 3s var(--ease-in-out) infinite;
  animation-delay: var(--delay, 0s);
  transition: transform var(--duration-moderate) var(--ease-default),
              opacity var(--duration-moderate) var(--ease-default);
}

.is-dragging .ie__pill {
  animation-play-state: paused;
  transform: scale(0.9);
  opacity: 0.5;
}

@keyframes ie-pill-drift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* ── Confirm State ── */

.ie__confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-s);
}

.ie__file-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-xxs) var(--space-s);
  background: var(--color-frame-hover);
  border-radius: var(--radius-m);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
}

.ie__file-icon {
  color: var(--color-frame-fg-muted);
  flex-shrink: 0;
}

.ie__file-name {
  font-weight: var(--font-weight-medium);
}

.ie__file-sep {
  color: var(--color-frame-fg-muted);
}

.ie__file-size {
  color: var(--color-frame-fg-muted);
}

.ie__confirm-actions {
  display: flex;
  gap: var(--space-xs);
}

/* ── Stepper ── */

.ie__stepper-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  padding-block: var(--space-xs);
}

.ie__stepper {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.ie__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  position: relative;
  min-width: 80px;
}

.ie__step:not(.is-last)::after {
  content: '';
  position: absolute;
  inset-block-start: 10px;
  inset-inline-start: calc(50% + 14px);
  width: calc(100% - 28px);
  height: 2px;
  background: var(--color-frame-border);
  transition: background var(--duration-moderate) var(--ease-default);
}

.ie__step.is-done:not(.is-last)::after {
  background: var(--color-frame-theme);
}

.ie__step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-frame-border);
  background: var(--color-frame-bg);
  transition: border-color var(--duration-moderate) var(--ease-default),
              background var(--duration-moderate) var(--ease-default),
              box-shadow var(--duration-moderate) var(--ease-default);
  position: relative;
  z-index: 1;
}

.is-active .ie__step-dot {
  border-color: var(--color-frame-theme);
  animation: ie-step-pulse 1.5s var(--ease-in-out) infinite;
}

.is-done .ie__step-dot {
  border-color: var(--color-frame-theme);
  background: var(--color-frame-theme);
}

.ie__step-check {
  color: var(--color-frame-bg);
}

.ie__step-label {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

.is-active .ie__step-label {
  color: var(--color-frame-fg);
  font-weight: var(--font-weight-medium);
}

.is-done .ie__step-label {
  color: var(--color-frame-theme);
}

@keyframes ie-step-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-frame-theme) 30%, transparent); }
  50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-frame-theme) 15%, transparent); }
}

/* ── Done State ── */

.ie__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-s);
  padding-block: var(--space-xs);
}

.ie__done-actions {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  animation: ie-fade-in var(--duration-slow) var(--ease-out) 700ms both;
}

/* ── Animated Checkmark ── */

.ie__checkmark {
  fill: none;
}

.ie__checkmark circle {
  stroke: var(--color-frame-theme);
  stroke-width: 2;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: ie-draw-circle 400ms var(--ease-out) forwards;
}

.ie__checkmark path {
  stroke: var(--color-frame-theme);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: ie-draw-check 300ms var(--ease-out) 400ms forwards;
}

@keyframes ie-draw-circle {
  to { stroke-dashoffset: 0; }
}

@keyframes ie-draw-check {
  to { stroke-dashoffset: 0; }
}

@keyframes ie-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Text Button ── */

.ie__text-btn {
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-frame-theme);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xxs) var(--space-xs);
  border-radius: var(--radius-s);
  transition: background var(--duration-fast) var(--ease-default);
}

.ie__text-btn:hover {
  background: var(--color-frame-hover);
}

/* ── Error ── */

.ie__error {
  color: var(--color-frame-danger);
  text-align: center;
}

.ie__error :deep(.text) {
  color: var(--color-frame-danger);
}

/* ── Hidden file input ── */

.ie__file-input {
  display: none;
}

/* ── Drag Overlay ── */

.ie__drag-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-m);
  background: color-mix(in srgb, var(--color-frame-bg) 70%, transparent);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.ie__drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-frame-theme);
}

.ie__drag-arrow {
  color: var(--color-frame-theme);
  animation: ie-bounce 1s var(--ease-in-out) infinite;
}

@keyframes ie-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

/* ── Drag Overlay Transition ── */

.ie-overlay-enter-active,
.ie-overlay-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.ie-overlay-enter-from,
.ie-overlay-leave-to {
  opacity: 0;
}

/* ── State Transitions ── */

.ie-fade-enter-active,
.ie-fade-leave-active {
  transition: opacity var(--duration-moderate) var(--ease-default),
              transform var(--duration-moderate) var(--ease-default);
}

.ie-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.ie-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
