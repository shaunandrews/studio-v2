<script setup lang="ts">
import { computed, ref, watch, nextTick, toRef } from 'vue'
import { useProjects } from '@/data/useProjects'
import { usePipeline } from '@/data/usePipeline'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import StageCard from './StageCard.vue'
import PipelineConnector from './PipelineConnector.vue'

const props = defineProps<{
  projectId: string
  projectStatus: 'running' | 'stopped' | 'loading'
  projectUrl: string
}>()

const { projects } = useProjects()
const { pipeline, setupPhase, skipSetupStep, openSyncModal, openConnectModal, syncAction, syncProgress } = usePipeline(toRef(props, 'projectId'))

const project = computed(() => projects.value.find(p => p.id === props.projectId))

const isSetup = computed(() => setupPhase.value !== null)

// ── Setup step definitions ──
// Phase -1 = local, 0+ = pipeline stage indices

interface SetupStep {
  title: string
  subtitle: string
}

const STEP_LOCAL: SetupStep = {
  title: 'Step 1: Your local site',
  subtitle: 'This is where you build and test. Changes here stay private until you push them.',
}

const STEP_DEFS: Record<string, SetupStep> = {
  staging: {
    title: 'Step 2: Connect your staging site',
    subtitle: 'A place for you to test changes without stress or worry.',
  },
  production: {
    title: 'Step 3: Connect your production site',
    subtitle: 'Your live website that visitors see. Deploy here when you\'re ready.',
  },
}

const currentStep = computed((): SetupStep | null => {
  if (setupPhase.value === null) return null
  if (setupPhase.value === -1) return STEP_LOCAL
  const stage = pipeline.value[setupPhase.value]
  return STEP_DEFS[stage?.environment ?? ''] ?? null
})

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
  if (environment === 'production') return 'var(--color-env-production)'
  if (environment === 'staging') return 'var(--color-env-staging)'
  return 'var(--color-env-local)'
}
</script>

<template>
  <ScreenLayout
    title="Sync your site across environments"
    subtitle="Work locally, push to staging to test, then deploy to production when ready."
  >
    <div class="sync-pipeline__layout" :class="{ 'is-setup': isSetup }">
      <div ref="envContainerRef" class="sync-pipeline__environments">
        <StageCard
          data-setup-index="-1"
          label="Local"
          :url="projectUrl"
          :favicon="project?.favicon"
          :connected="true"
          :env-color="envColor('local')"
          :sync-phase="getProgress('local').phase"
          :sync-percent="getProgress('local').percent"
          :sync-label="getProgress('local').label"
          :sync-done-at="getProgress('local').doneAt"
          :sync-done-verb="getProgress('local').doneVerb"
          @sync="onSync('local')"
        />

        <template v-for="(stage, index) in pipeline" :key="stage.id">
          <PipelineConnector
            :from-label="index === 0 ? 'Local' : pipeline[index - 1].label"
            :to-label="stage.label"
            :to-connected="!!stage.site"
            :dimmed="isSetup && index > setupPhase!"
            @push="onConnectorPush(index === 0 ? 'local' : pipeline[index - 1].id, stage.id)"
          />
          <StageCard
            :data-setup-index="index"
            :label="stage.label"
            :url="stage.site?.url"
            :favicon="project?.favicon"
            :connected="!!stage.site"
            :env-color="envColor(stage.environment)"
            :dimmed="isSetup && index > setupPhase!"
            :sync-phase="getProgress(stage.id).phase"
            :sync-percent="getProgress(stage.id).percent"
            :sync-label="getProgress(stage.id).label"
            :sync-done-at="getProgress(stage.id).doneAt"
            :sync-done-verb="getProgress(stage.id).doneVerb"
            @sync="onSync(stage.id)"
            @connect="openConnectModal(stage.id)"
          />
        </template>
      </div>

      <!-- Setup guide panel on the right -->
      <div v-if="currentStep" class="setup-guide" :style="{ paddingBlockStart: guideOffset + 'px' }">
        <p class="setup-guide__title">{{ currentStep.title }}</p>
        <p class="setup-guide__subtitle">{{ currentStep.subtitle }}</p>
        <button v-if="isLocalStep" class="setup-guide__action" @click="skipSetupStep">
          Got it
        </button>
        <button v-else class="setup-guide__skip" @click="skipSetupStep">
          Skip this step
        </button>
      </div>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.sync-pipeline__layout {
  max-width: 680px;
  margin-inline: auto;
  width: 100%;
}

.sync-pipeline__layout.is-setup {
  display: flex;
  gap: var(--space-xxl);
  max-width: none;
}

.sync-pipeline__environments {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  width: 100%;
}

.is-setup .sync-pipeline__environments {
  max-width: 420px;
  flex-shrink: 0;
}

/* ── Setup guide panel ── */

.setup-guide {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  max-width: 280px;
  transition: padding-block-start 200ms var(--ease-default);
}

.setup-guide__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.setup-guide__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-secondary);
  margin: 0;
}

.setup-guide__action {
  align-self: flex-start;
  height: 32px;
  padding-inline: var(--space-m);
  margin-block-start: var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--duration-instant) var(--ease-default),
    border-color var(--duration-instant) var(--ease-default);
}

.setup-guide__action:hover {
  background: var(--color-frame-bg-secondary);
  border-color: var(--color-frame-fg-muted);
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
