<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useSites } from '@/data/useSites'
import { usePipeline } from '@/data/usePipeline'
import Pane from '@/components/composites/Pane.vue'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import StageCard from './StageCard.vue'
import PipelineConnector from './PipelineConnector.vue'
import SiteTimeline from '@/components/features/SiteTimeline.vue'

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

// ── Setup step definitions ──
// Phase -2 = intro, -1 = local, 0+ = pipeline stage indices

interface SetupStep {
  title: string
  subtitle: string
}

const STEP_INTRO: SetupStep = {
  title: 'Your sync pipeline',
  subtitle: 'Connect your staging and production sites so you can track what\'s changed and move updates between environments.',
}

const STEP_LOCAL: SetupStep = {
  title: 'Your local site',
  subtitle: 'Where you make changes. Everything starts here.',
}

const STEP_DEFS: Record<string, SetupStep> = {
  staging: {
    title: 'Connect staging',
    subtitle: 'A safe place to test changes before they go live.',
  },
  production: {
    title: 'Connect production',
    subtitle: 'Your live site. Sync with care.',
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

// During progressive reveal, stages beyond setupPhase are hidden entirely
function isStageRevealed(index: number): boolean {
  if (!isSetup.value || isIntroStep.value) return true
  if (isLocalStep.value) return false
  return index <= setupPhase.value!
}

// ── Sync progress ──

const syncingCardId = computed(() => {
  if (!syncAction.value || syncProgress.value.phase === 'idle') return null
  return syncAction.value.toStage
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
function effectiveSource(index: number): { id: string; label: string; connected: boolean } {
  if (index === 0) return { id: 'local', label: 'Local', connected: true }
  const prev = pipeline.value[index - 1]
  if (prev.site) return { id: prev.id, label: prev.label, connected: true }
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
    const firstConnected = pipeline.value.find(s => s.site)
    if (firstConnected) {
      openSyncModal('pull', firstConnected.id, 'local', 'sync')
    }
  } else {
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
  <Pane scrollable>
    <div class="sync-pipeline__layout" :class="{ 'is-intro': isIntroStep, 'is-setup': isSetup }">
      <div class="sync-pipeline__environments">
        <!-- Changes list (active mode only) -->
        <SiteTimeline v-if="!isSetup" :site-id="siteId" />

        <!-- Setup guide: below Local card (before in DOM = below in column-reverse) -->
        <Transition name="step-fade">
          <div v-if="isLocalStep && currentStep" class="setup-guide-inline" key="local-guide">
            <Text variant="body" weight="semibold" tag="p">{{ currentStep.title }}</Text>
            <Text variant="body-small" color="muted" tag="p">{{ currentStep.subtitle }}</Text>
            <Button label="Continue" variant="secondary" size="small" class="setup-guide-inline__action" @click="skipSetupStep" />
          </div>
        </Transition>

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
          <template v-if="isStageRevealed(index)">
            <!-- Compact skipped stage -->
            <template v-if="!stage.site && hasLaterConnectedStage(index)">
              <div class="sync-pipeline__skip-zone">
                <PipelineConnector
                  :from-label="effectiveSource(index + 1).label"
                  :to-label="pipeline[index + 1]?.label ?? stage.label"
                  :from-connected="effectiveSource(index + 1).connected"
                  :to-connected="!!pipeline[index + 1]?.site"
                  @push="onConnectorPush(effectiveSource(index + 1).id, pipeline[index + 1]?.id ?? stage.id)"
                />
                <StageCard
                  class="sync-pipeline__skip-card"
                  :data-setup-index="index"
                  :label="stage.label"
                  :connected="false"
                  compact
                  :env-color="envColor(stage.environment)"
                  @connect="openConnectModal(stage.id)"
                />
              </div>
            </template>

            <!-- Normal flow -->
            <template v-else>
              <!-- Setup guide: before card in DOM = below card visually -->
              <Transition name="step-fade">
                <div v-if="setupPhase === index && currentStep" :key="`guide-${stage.id}`" class="setup-guide-inline">
                  <Text variant="body" weight="semibold" tag="p">{{ currentStep.title }}</Text>
                  <Text variant="body-small" color="muted" tag="p">{{ currentStep.subtitle }}</Text>
                  <Button label="Skip this step" variant="tertiary" size="small" class="setup-guide-inline__action" @click="skipSetupStep" />
                </div>
              </Transition>

              <!-- Connector: hide during setup for the active step -->
              <PipelineConnector
                v-if="setupPhase !== index && !(index > 0 && !pipeline[index - 1].site && hasLaterConnectedStage(index - 1))"
                :from-label="effectiveSource(index).label"
                :to-label="stage.label"
                :from-connected="effectiveSource(index).connected"
                :to-connected="!!stage.site"
                @push="onConnectorPush(effectiveSource(index).id, stage.id)"
              />
              <StageCard
                :data-setup-index="index"
                :label="stage.label"
                :url="stage.site?.url"
                :favicon="site?.favicon"
                :site-name="site?.name"
                :connected="!!stage.site"
                :show-menu="!isSetup && !!stage.site"
                :env-color="envColor(stage.environment)"
                :sync-phase="getProgress(stage.id).phase"
                :sync-percent="getProgress(stage.id).percent"
                :sync-label="getProgress(stage.id).label"
                :sync-done-at="getProgress(stage.id).doneAt"
                :sync-done-verb="getProgress(stage.id).doneVerb"
                sync-button-label="Pull"
                @sync="onSync(stage.id)"
                @connect="openConnectModal(stage.id)"
                @replace="openConnectModal(stage.id)"
                @disconnect="disconnectSite(stage.id)"
              />
            </template>
          </template>
        </template>
      </div>

      <!-- Intro guide (below scaled rack preview) -->
      <Transition name="step-fade">
        <div v-if="isIntroStep && currentStep" key="intro-guide" class="setup-guide">
          <Text variant="body" weight="semibold" tag="p">{{ currentStep.title }}</Text>
          <Text variant="body" color="muted" tag="p">{{ currentStep.subtitle }}</Text>
          <Button label="Continue" variant="secondary" size="small" class="setup-guide__cta" @click="skipSetupStep" />
        </div>
      </Transition>
    </div>
  </Pane>
</template>

<style scoped>
.sync-pipeline__layout {
  display: flex;
  flex-direction: column;
  margin-inline: auto;
  margin-block: auto;
  width: 100%;
  max-width: 680px;
  padding: var(--space-m) var(--space-l) var(--space-l);
  transition: gap var(--duration-slow) var(--ease-default);
}

.sync-pipeline__environments {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  gap: var(--space-xxs);
  width: 100%;
  /* Smooth scale and layout changes between setup steps */
  transition: transform var(--duration-slow) var(--ease-out);
}

/* ── Skip-zone ── */

.sync-pipeline__skip-zone {
  position: relative;
  padding-block: var(--space-xxxs);
}

.sync-pipeline__skip-card {
  position: absolute;
  inset-inline-end: 0;
  inset-block-start: 50%;
  translate: 0 -50%;
}

/* ── Intro layout: scaled rack preview ── */

.sync-pipeline__layout.is-intro {
  align-items: center;
  gap: var(--space-l);
}

.is-intro .sync-pipeline__environments {
  transform: scale(0.8);
  transform-origin: top center;
  pointer-events: none;
}

.is-intro :deep(.connector__push-btn) {
  opacity: 0;
}

.is-intro :deep(.connector__line) {
  height: 8px;
}

.is-intro :deep(.sync-env__action),
.is-intro :deep(.sync-env .btn) {
  opacity: 0;
}

/* ── Setup guide: intro (centered below rack) ── */

.setup-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-xxs);
  max-width: 420px;
  align-self: center;
}

.setup-guide__cta {
  margin-block-start: var(--space-s);
}

.setup-guide p {
  margin: 0;
}

/* ── Setup guide: inline (below active card during progressive reveal) ── */

.setup-guide-inline {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  padding: var(--space-s) var(--space-m);
  max-width: 320px;
}

.setup-guide-inline p {
  margin: 0;
}

.setup-guide-inline__action {
  align-self: flex-start;
  margin-block-start: var(--space-xxs);
}

/* ── Step transitions ── */

.step-fade-enter-active {
  transition:
    opacity var(--duration-slow) var(--ease-out),
    transform var(--duration-slow) var(--ease-out);
}

.step-fade-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-in),
    transform var(--duration-fast) var(--ease-in);
  position: absolute;
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.step-fade-leave-to {
  opacity: 0;
}
</style>
