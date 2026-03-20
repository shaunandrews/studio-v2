<script setup lang="ts">
import { computed, ref, watch, nextTick, toRef } from 'vue'
import { useSites } from '@/data/useSites'
import { usePipeline } from '@/data/usePipeline'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import StageCard from './StageCard.vue'
import PipelineConnector from './PipelineConnector.vue'

const props = defineProps<{
  siteId: string
  siteStatus: 'running' | 'stopped' | 'loading'
  siteUrl: string
}>()

const { sites } = useSites()
const { pipeline, setupPhase, skipSetupStep, openSyncModal, openConnectModal, disconnectSite, syncAction, syncProgress } = usePipeline(toRef(props, 'siteId'))

const site = computed(() => sites.value.find(p => p.id === props.siteId))

const isSetup = computed(() => setupPhase.value !== null)
const hasConnectedStage = computed(() => pipeline.value.some(s => s.site))

// Keep layout in setup mode briefly while the guide fades out and envs expand
const setupEnding = ref(false)
const showSetupLayout = computed(() => isSetup.value || setupEnding.value)

watch(isSetup, (val, oldVal) => {
  if (!val && oldVal) {
    setupEnding.value = true
    setTimeout(() => { setupEnding.value = false }, 500)
  }
})

// ── Setup step definitions ──
// Phase -2 = intro, -1 = local, 0+ = pipeline stage indices

interface SetupStep {
  title: string
  subtitle: string
}

const STEP_INTRO: SetupStep = {
  title: 'Your sync pipeline',
  subtitle: 'Build locally, push to staging to test, then deploy to production when ready. Connect each environment below to get started.',
}

const STEP_LOCAL: SetupStep = {
  title: 'Your local site',
  subtitle: 'This is your local WordPress site, running in Studio. It\'s the starting point for all your changes.',
}

const STEP_DEFS: Record<string, SetupStep> = {
  staging: {
    title: 'Connect a staging site',
    subtitle: 'Test changes before they go live.',
  },
  production: {
    title: 'Connect a production site',
    subtitle: 'Your live site that visitors see.',
  },
}

const currentStep = computed((): SetupStep | null => {
  if (setupPhase.value === null) return null
  if (setupPhase.value === -2) return STEP_INTRO
  if (setupPhase.value === -1) return STEP_LOCAL
  const stage = pipeline.value[setupPhase.value]
  return STEP_DEFS[stage?.environment ?? ''] ?? null
})

const isIntroStep = computed(() => setupPhase.value === -2)
const isLocalStep = computed(() => setupPhase.value === -1)

// ── Guide vertical alignment ──

const envContainerRef = ref<HTMLElement | null>(null)
const guideOffset = ref(0)

function measureGuideOffset() {
  const container = envContainerRef.value
  if (!container || setupPhase.value === null) return

  // phase -1 = local (index 0 card), phase 0 = staging (index 1 card), etc.
  // Cards have data-setup-index: -1 for local, 0 for first pipeline stage, etc.
  const selector = `[data-setup-index="${setupPhase.value}"]`
  const card = container.querySelector(selector) as HTMLElement | null
  if (card) {
    guideOffset.value = card.offsetTop
  }
}

watch(setupPhase, () => {
  nextTick(measureGuideOffset)
}, { immediate: true })

// ── Sync progress ──

const syncingCardId = computed(() => {
  if (!syncAction.value || syncProgress.value.phase === 'idle') return null
  return syncAction.value.verb === 'pull' ? syncAction.value.toStage : syncAction.value.toStage
})

function getProgress(cardId: string) {
  if (syncingCardId.value !== cardId) return syncProgress.value.phase === 'idle' ? syncProgress.value : { phase: 'idle' as const, percent: 0, label: '', doneAt: undefined, doneVerb: undefined }
  return syncProgress.value
}

// True when there's a connected stage after this one — used to decide
// whether to hide the connector and shrink an unconnected card.
function hasLaterConnectedStage(index: number): boolean {
  for (let i = index + 1; i < pipeline.value.length; i++) {
    if (pipeline.value[i].site) return true
  }
  return false
}

// Walk back from a connector's natural source to find the nearest connected stage.
// If the previous pipeline stage isn't connected, fall back to Local so users can
// push directly (e.g. Local → Production when Staging is skipped).
function effectiveSource(index: number): { id: string; label: string; connected: boolean } {
  if (index === 0) return { id: 'local', label: 'Local', connected: true }
  const prev = pipeline.value[index - 1]
  if (prev.site) return { id: prev.id, label: prev.label, connected: true }
  // Previous stage not connected — walk back
  for (let i = index - 2; i >= 0; i--) {
    const s = pipeline.value[i]
    if (s.site) return { id: s.id, label: s.label, connected: true }
  }
  return { id: 'local', label: 'Local', connected: true }
}

function onConnectorPush(fromStageId: string, toStageId: string) {
  openSyncModal('push', fromStageId, toStageId)
}

function onSync(stageId: string) {
  if (stageId === 'local') {
    // Local Sync button: default to first connected stage
    const firstConnected = pipeline.value.find(s => s.site)
    if (firstConnected) {
      openSyncModal('pull', firstConnected.id, 'local', 'sync')
    }
  } else {
    // Stage Sync button: use that specific stage
    openSyncModal('pull', stageId, 'local', 'sync')
  }
}

function envColor(environment?: string): string {
  if (environment === 'production') return 'var(--color-env-production-bg)'
  if (environment === 'staging') return 'var(--color-env-staging-bg)'
  return 'var(--color-env-local-bg)'
}
</script>

<template>
  <ScreenLayout>
    <div class="sync-pipeline__layout" :class="{ 'is-setup': showSetupLayout, 'is-ending': setupEnding, 'is-intro': isIntroStep }">
      <div ref="envContainerRef" class="sync-pipeline__environments">
        <StageCard
          data-setup-index="-1"
          label="Local"
          :url="siteUrl"
          :favicon="site?.favicon"
          :site-name="site?.name"
          :connected="true"
          :sync-disabled="!hasConnectedStage"
          :env-color="envColor('local')"
          :sync-phase="getProgress('local').phase"
          :sync-percent="getProgress('local').percent"
          :sync-label="getProgress('local').label"
          :sync-done-at="getProgress('local').doneAt"
          :sync-done-verb="getProgress('local').doneVerb"
          @sync="onSync('local')"
        />

        <template v-for="(stage, index) in pipeline" :key="stage.id">
          <!-- Compact skipped stage: sits beside the skip-connector in a horizontal row -->
          <template v-if="!stage.site && hasLaterConnectedStage(index)">
            <div class="sync-pipeline__skip-zone">
              <PipelineConnector
                :from-label="effectiveSource(index + 1).label"
                :to-label="pipeline[index + 1]?.label ?? stage.label"
                :from-connected="effectiveSource(index + 1).connected"
                :to-connected="!!pipeline[index + 1]?.site"
                :dimmed="isSetup && !isIntroStep && (index + 1) > setupPhase!"
                @push="onConnectorPush(effectiveSource(index + 1).id, pipeline[index + 1]?.id ?? stage.id)"
              />
              <StageCard
                class="sync-pipeline__skip-card"
                :data-setup-index="index"
                :label="stage.label"
                :connected="false"
                compact
                :env-color="envColor(stage.environment)"
                :dimmed="isSetup && !isIntroStep && index > setupPhase!"
                @connect="openConnectModal(stage.id)"
              />
            </div>
          </template>

          <!-- Normal flow: connector then card -->
          <template v-else>
            <!-- Hide connector if next stage already rendered it in the skip-row -->
            <PipelineConnector
              v-if="!(index > 0 && !pipeline[index - 1].site && hasLaterConnectedStage(index - 1))"
              :from-label="effectiveSource(index).label"
              :to-label="stage.label"
              :from-connected="effectiveSource(index).connected"
              :to-connected="!!stage.site"
              :dimmed="isSetup && !isIntroStep && index > setupPhase!"
              @push="onConnectorPush(effectiveSource(index).id, stage.id)"
            />
            <StageCard
              :data-setup-index="index"
              :label="stage.label"
              :url="stage.site?.url"
              :favicon="site?.favicon"
              :site-name="site?.name"
              :connected="!!stage.site"
              :show-menu="!!stage.site"
              :env-color="envColor(stage.environment)"
              :dimmed="isSetup && !isIntroStep && index > setupPhase!"
              :sync-phase="getProgress(stage.id).phase"
              :sync-percent="getProgress(stage.id).percent"
              :sync-label="getProgress(stage.id).label"
              :sync-done-at="getProgress(stage.id).doneAt"
              :sync-done-verb="getProgress(stage.id).doneVerb"
              @sync="onSync(stage.id)"
              @connect="openConnectModal(stage.id)"
              @replace="openConnectModal(stage.id)"
              @disconnect="disconnectSite(stage.id)"
            />
          </template>
        </template>
      </div>

      <!-- Setup guide panel on the right -->
      <Transition name="guide-fade">
      <div v-if="currentStep" class="setup-guide" :style="{ paddingBlockStart: guideOffset + 'px' }">
        <Text variant="body" weight="semibold" tag="p">{{ currentStep.title }}</Text>
        <Text variant="body" color="muted" tag="p">{{ currentStep.subtitle }}</Text>
        <Button v-if="isIntroStep" label="Get started" variant="primary" size="small" class="setup-guide__cta" @click="skipSetupStep" />
        <Button v-else-if="isLocalStep" label="Continue" variant="secondary" size="small" class="setup-guide__cta" @click="skipSetupStep" />
        <button v-else class="setup-guide__skip" @click="skipSetupStep">
          Skip this step
        </button>
      </div>
      </Transition>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.sync-pipeline__layout {
  display: flex;
  gap: var(--space-xxl);
  margin-inline: auto;
  width: 100%;
  max-width: 680px;
}

.sync-pipeline__layout.is-setup {
  max-width: none;
}

.sync-pipeline__environments {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  width: 100%;
  max-width: 680px;
  transition: max-width 400ms var(--ease-default), transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.is-setup .sync-pipeline__environments {
  max-width: 360px;
  flex-shrink: 0;
  transform: scale(1);
}

.is-ending .sync-pipeline__environments {
  max-width: 680px;
  transform: scale(1);
}

/* ── Skip-zone: connector centered, compact card positioned to the end ── */

.sync-pipeline__skip-zone {
  position: relative;
  padding-block: var(--space-s);
}

.sync-pipeline__skip-card {
  position: absolute;
  inset-inline-end: 0;
  inset-block-start: 50%;
  translate: 0 -50%;
}

/* ── Intro layout: centered column, stack scaled down ── */

.sync-pipeline__layout.is-intro {
  flex-direction: column;
  align-items: center;
}

.is-intro .sync-pipeline__environments {
  transform: scale(0.8);
  transform-origin: top center;
}

.is-intro .setup-guide {
  order: -1;
  align-items: center;
  text-align: center;
}

.is-intro :deep(.connector__push-btn) {
  display: none;
}

.is-intro :deep(.connector__line) {
  height: 8px;
}

.is-intro .sync-pipeline__environments {
  pointer-events: none;
}

.is-intro :deep(.sync-env__action),
.is-intro :deep(.sync-env .btn) {
  display: none;
}

/* ── Setup guide panel ── */

.setup-guide {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  min-width: 280px;
  max-width: 480px;
  transition: padding-block-start 200ms var(--ease-default);
}

.setup-guide__cta {
  margin-block-start: var(--space-m);
}

.setup-guide p {
  margin: 0;
}

/* ── Guide fade transition ── */

.guide-fade-enter-active {
  transition: opacity 200ms var(--ease-default);
}

.guide-fade-leave-active {
  transition: opacity 300ms var(--ease-default);
}

.guide-fade-enter-from,
.guide-fade-leave-to {
  opacity: 0;
}

.setup-guide__skip {
  align-self: flex-start;
  height: 28px;
  padding-inline: 0;
  margin-block-start: var(--space-xs);
  border: none;
  border-radius: var(--radius-m);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--duration-instant) var(--ease-default);
}

.setup-guide__skip:hover {
  color: var(--color-frame-fg);
}
</style>
