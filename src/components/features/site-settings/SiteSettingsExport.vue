<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useSites } from '@/data/useSites'
import { useImportExport } from '@/data/useImportExport'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'
import ContentSelector from '@/components/composites/ContentSelector.vue'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

const {
  exportState,
  isImporting,
  isExporting,
  isExportDone,
  isConfirming,
  startExport,
  clearExport,
  EXPORT_STAGES_FULL,
  EXPORT_STAGES_DB,
  EXPORT_STAGES_FILES,
} = useImportExport(toRef(props, 'siteId'))

const contentSelectorRef = ref<InstanceType<typeof ContentSelector> | null>(null)

function handleExport() {
  const type = contentSelectorRef.value?.exportType ?? 'full'
  startExport(type)
}

const canExport = computed(() => contentSelectorRef.value?.canExport ?? true)

const activeExportStages = computed(() => {
  if (!exportState.value) return EXPORT_STAGES_FULL
  if (exportState.value.exportType === 'database') return EXPORT_STAGES_DB
  if (exportState.value.exportType === 'files') return EXPORT_STAGES_FILES
  return EXPORT_STAGES_FULL
})

const isNewSite = computed(() => !site.value?.mockLayout)
const exportDisabled = computed(() => isImporting.value || isExporting.value || isConfirming.value || isNewSite.value)
</script>

<template>
  <SettingsSection title="Export">
    <Text variant="body-small" color="muted">Your data, your rules. Take it anywhere.</Text>
    <Transition name="ie-fade" mode="out-in">
      <!-- Empty site -->
      <div v-if="isNewSite && !isExporting && !isExportDone" key="export-empty" class="ie__export-empty">
        <Text variant="body-small" color="muted">Nothing to export yet. Start building your site first.</Text>
      </div>

      <!-- Idle: options panel + button -->
      <div v-else-if="!isExporting && !isExportDone" key="export-idle" class="ie__export-options">
        <ContentSelector ref="contentSelectorRef" />
        <Button
          v-if="canExport"
          variant="primary"
          label="Export"
          :disabled="exportDisabled"
          @click="handleExport"
        />
      </div>

      <!-- Exporting -->
      <div v-else-if="isExporting" key="export-progress" class="ie__stepper-wrap">
        <div class="ie__stepper">
          <div
            v-for="(stage, i) in activeExportStages"
            :key="stage.key"
            class="ie__step"
            :class="{
              'is-done': i < (exportState?.currentStage ?? 0),
              'is-active': i === (exportState?.currentStage ?? 0),
              'is-pending': i > (exportState?.currentStage ?? 0),
              'is-last': i === activeExportStages.length - 1,
            }"
          >
            <div class="ie__step-dot">
              <svg v-if="i < (exportState?.currentStage ?? 0)" class="ie__step-check" viewBox="0 0 12 12" width="12" height="12">
                <path d="M3 6 L5.5 8.5 L9 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>
            </div>
            <span class="ie__step-label">{{ stage.label }}</span>
          </div>
        </div>
        <Text variant="body-small" color="muted">{{ exportState?.statusMessage ?? 'Exporting...' }}</Text>
      </div>

      <!-- Export done -->
      <div v-else-if="isExportDone" key="export-done" class="ie__done">
        <svg class="ie__checkmark" viewBox="0 0 36 36" width="36" height="36">
          <circle cx="18" cy="18" r="16" />
          <path d="M11 18 L16 23 L25 13" />
        </svg>
        <Text variant="body" weight="medium">Export complete!</Text>
        <Text variant="body-small" color="muted">{{ exportState?.statusMessage }}</Text>
        <button class="ie__text-btn" @click="clearExport">Export again</button>
      </div>
    </Transition>
  </SettingsSection>
</template>

<style scoped>
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

/* ── Export Empty State ── */

.ie__export-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
}

/* ── Export Options ── */

.ie__export-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
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
