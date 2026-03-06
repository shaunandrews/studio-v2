<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useSites } from '@/data/useSites'
import { useImportExport } from '@/data/useImportExport'
import Button from '@/components/primitives/Button.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

const {
  importState,
  exportState,
  isImporting,
  isExporting,
  isImportDone,
  isExportDone,
  isValidFile,
  startImport,
  startExport,
  clearImport,
  clearExport,
  ACCEPTED_FILE_TYPES,
} = useImportExport(toRef(props, 'siteId'))

// --- Drag and drop (screen-level overlay) ---

const isDragging = ref(false)
const fileError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleScreenDragEnter(e: DragEvent) {
  e.preventDefault()
  if (isImporting.value) return
  isDragging.value = true
  fileError.value = null
}

function handleScreenDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleScreenDragLeave(e: DragEvent) {
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

function handleScreenDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (isImporting.value || isExporting.value) return

  const file = e.dataTransfer?.files[0]
  if (!file) return

  if (!isValidFile(file.name)) {
    fileError.value = 'Unsupported file type. Use .zip, .gz, .tar, .tar.gz, .wpress, or .sql.'
    return
  }

  fileError.value = null
  startImport(file.name)
}

function openFileSelector() {
  if (isImporting.value || isExporting.value) return
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
  startImport(file.name)
  input.value = ''
}

function handleStartAgain() {
  clearImport()
  fileError.value = null
}

const importDisabled = computed(() => isImporting.value || isExporting.value)
const exportDisabled = computed(() => isImporting.value || isExporting.value)
</script>

<template>
  <ScreenLayout
    title="Import / Export"
    subtitle="Your data, your rules. Take it anywhere."
  >
    <div
      class="ie__grid"
      @dragenter="handleScreenDragEnter"
      @dragover="handleScreenDragOver"
      @dragleave="handleScreenDragLeave"
      @drop="handleScreenDrop"
    >
      <!-- ── Import card ── -->
      <div class="ie__card">
        <!-- Illustration: arrow pointing into a box -->
        <div class="ie__illustration">
          <div class="ie__illo-box">
            <div class="ie__illo-box-flap ie__illo-box-flap--left" />
            <div class="ie__illo-box-flap ie__illo-box-flap--right" />
          </div>
          <svg class="ie__illo-arrow ie__illo-arrow--down" width="20" height="32" viewBox="0 0 20 32" fill="none">
            <path d="M10 0 L10 24 M3 17 L10 24 L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <div class="ie__card-body">
          <h3 class="ie__card-title">Import</h3>
          <p class="ie__card-desc">
            Restore from a Jetpack backup, site archive, or .sql database file.
          </p>
        </div>

        <!-- States -->
        <div class="ie__card-footer">
          <template v-if="!isImporting && !isImportDone">
            <Button
              variant="primary"
              label="Choose file..."
              :disabled="importDisabled"
              @click="openFileSelector"
            />
            <span class="ie__hint">or drag a file anywhere here</span>
          </template>

          <template v-if="isImporting">
            <div class="ie__progress">
              <div class="ie__progress-bar">
                <div class="ie__progress-fill" :style="{ width: `${importState?.progress ?? 0}%` }" />
              </div>
              <span class="ie__progress-label">{{ importState?.statusMessage ?? 'Importing...' }}</span>
            </div>
          </template>

          <template v-if="isImportDone">
            <div class="ie__done">
              <Button variant="primary" label="Open site" @click.stop />
              <button class="ie__link-btn" @click="handleStartAgain">Start again</button>
            </div>
          </template>

          <div v-if="fileError" class="ie__error">{{ fileError }}</div>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          :accept="ACCEPTED_FILE_TYPES.join(',') + ',.sql'"
          class="ie__file-input"
          @change="onFileSelected"
        />
      </div>

      <!-- ── Export card ── -->
      <div class="ie__card">
        <!-- Illustration: arrow pointing out of a box -->
        <div class="ie__illustration">
          <div class="ie__illo-box ie__illo-box--open">
            <div class="ie__illo-box-flap ie__illo-box-flap--left ie__illo-box-flap--open" />
            <div class="ie__illo-box-flap ie__illo-box-flap--right ie__illo-box-flap--open" />
          </div>
          <svg class="ie__illo-arrow ie__illo-arrow--up" width="20" height="32" viewBox="0 0 20 32" fill="none">
            <path d="M10 32 L10 8 M3 15 L10 8 L17 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <div class="ie__card-body">
          <h3 class="ie__card-title">Export</h3>
          <p class="ie__card-desc">
            Download your entire site or just the database as an archive.
          </p>
        </div>

        <div class="ie__card-footer">
          <template v-if="!isExporting && !isExportDone">
            <div class="ie__button-row">
              <Button
                variant="primary"
                label="Entire site"
                :disabled="exportDisabled"
                @click="startExport('full')"
              />
              <Button
                variant="secondary"
                label="Database only"
                :disabled="exportDisabled"
                @click="startExport('database')"
              />
            </div>
          </template>

          <template v-if="isExporting">
            <div class="ie__progress">
              <div class="ie__progress-bar">
                <div class="ie__progress-fill" :style="{ width: `${exportState?.progress ?? 0}%` }" />
              </div>
              <span class="ie__progress-label">{{ exportState?.statusMessage ?? 'Exporting...' }}</span>
            </div>
          </template>

          <template v-if="isExportDone">
            <button class="ie__clear-btn" @click="clearExport">
              <span class="ie__clear-text">{{ exportState?.statusMessage }}</span>
              <span class="ie__clear-x">&times;</span>
            </button>
          </template>
        </div>
      </div>

      <!-- ── Drag overlay ── -->
      <Transition name="drop-overlay">
        <div v-if="isDragging" class="ie__drop-overlay">
          <div class="ie__drop-overlay-content">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4 L16 22 M8 14 L16 22 L24 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 26 L28 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
            <span>Drop file to import</span>
          </div>
        </div>
      </Transition>
    </div>
  </ScreenLayout>
</template>

<style scoped>
/* ── Grid layout ── */

.ie__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
  position: relative;
}

/* ── Card ── */

.ie__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-m);
  padding: var(--space-l) var(--space-m);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  background: var(--color-frame-bg);
}

.ie__card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.ie__card-title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.ie__card-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.ie__card-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  width: 100%;
}

/* ── Illustrations ── */

.ie__illustration {
  position: relative;
  width: 100%;
  height: 90px;
  border-radius: var(--radius-m);
  background:
    radial-gradient(ellipse 100% 90px at center, transparent 50%, rgba(0, 0, 0, 0.04) 100%),
    rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ie__illo-box {
  width: 44px;
  height: 32px;
  border: 2px solid var(--color-frame-fg-muted);
  border-radius: 2px 2px var(--radius-s) var(--radius-s);
  position: relative;
  opacity: 0.6;
  /* No top border — the flaps are the lid */
  border-block-start: none;
  margin-block-start: 14px;
}

.ie__illo-box-flap {
  position: absolute;
  inset-block-start: -2px;
  width: 50%;
  height: 2px;
  background: var(--color-frame-fg-muted);
}

.ie__illo-box-flap--left {
  inset-inline-start: 0;
  transform-origin: 0% 50%;
}

.ie__illo-box-flap--right {
  inset-inline-end: 0;
  transform-origin: 100% 50%;
}

.ie__illo-box-flap--open.ie__illo-box-flap--left {
  transform: rotate(-45deg);
}

.ie__illo-box-flap--open.ie__illo-box-flap--right {
  transform: rotate(45deg);
}

.ie__illo-arrow {
  position: absolute;
  color: var(--color-frame-theme);
  opacity: 0.7;
}

.ie__illo-arrow--down {
  inset-block-start: 8px;
}

.ie__illo-arrow--up {
  inset-block-start: 4px;
}

/* ── Import hint ── */

.ie__hint {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

/* ── Button row ── */

.ie__button-row {
  display: flex;
  gap: var(--space-xs);
}

/* ── Progress ── */

.ie__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  width: 100%;
}

.ie__progress-bar {
  width: 100%;
  max-width: 200px;
  height: 4px;
  background: var(--color-frame-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ie__progress-fill {
  height: 100%;
  background: var(--color-frame-theme);
  border-radius: var(--radius-full);
  transition: width 300ms var(--ease-default);
}

.ie__progress-label {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

/* ── Done state ── */

.ie__done {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.ie__link-btn {
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-frame-theme);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xxxs) var(--space-xxs);
}

.ie__link-btn:hover {
  text-decoration: underline;
}

/* ── Clear button (export done) ── */

.ie__clear-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg);
  background: var(--color-frame-hover);
  border: none;
  border-radius: var(--radius-s);
  padding: var(--space-xxs) var(--space-xs);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.ie__clear-btn:hover {
  background: var(--color-frame-border);
}

.ie__clear-x {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1;
}

/* ── Error ── */

.ie__error {
  font-size: var(--font-size-xs);
  color: var(--color-error, #dc2626);
  line-height: 1.5;
}

/* ── Hidden file input ── */

.ie__file-input {
  display: none;
}

/* ── Drop overlay ── */

.ie__drop-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-l);
  border: 2px dashed var(--color-frame-theme);
  background: color-mix(in srgb, var(--color-frame-theme) 6%, var(--color-frame-bg) 94%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.ie__drop-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-frame-theme);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
}

/* Drop overlay transition */
.drop-overlay-enter-active {
  transition:
    opacity var(--duration-instant) var(--ease-default);
}

.drop-overlay-leave-active {
  transition:
    opacity var(--duration-instant) var(--ease-default);
}

.drop-overlay-enter-from,
.drop-overlay-leave-to {
  opacity: 0;
}
</style>
