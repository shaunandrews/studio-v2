import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useSites } from './useSites'
import type { PipelineStage } from './types'

// Setup phases: -1 = local intro, 0+ = pipeline stage indices, null = done
const setupPhase = ref<number | null>(null)

const syncModalOpen = ref(false)
const syncMode = ref<'push' | 'sync'>('push')
const connectModalOpen = ref(false)
const connectStageId = ref<string | null>(null)
const syncAction = ref<{ verb: 'push' | 'pull' | 'promote'; fromStage: string; toStage: string } | null>(null)
const syncProgress = ref<{ phase: 'idle' | 'syncing' | 'done' | 'error'; percent: number; label: string; doneAt?: number; doneVerb?: string }>({
  phase: 'idle', percent: 0, label: '',
})

export function usePipeline(siteId: Ref<string | null>) {
  const { sites } = useSites()

  const site = computed(() =>
    sites.value.find(p => p.id === siteId.value) ?? null
  )

  const pipeline = computed(() => site.value?.pipeline ?? [])

  const hasPipeline = computed(() => pipeline.value.length > 0)

  function setupDefaultPipeline() {
    if (!site.value) return
    site.value.pipeline = [
      { id: `stage-${Date.now()}-1`, label: 'Staging', environment: 'staging' as EnvironmentType, order: 1 },
      { id: `stage-${Date.now()}-2`, label: 'Production', environment: 'production' as EnvironmentType, order: 2 },
    ]
    setupPhase.value = -1
  }

  function advanceSetup() {
    if (setupPhase.value === null) return
    const nextPhase = setupPhase.value + 1
    if (nextPhase < pipeline.value.length) {
      setupPhase.value = nextPhase
    } else {
      setupPhase.value = null
    }
  }

  function skipSetupStep() {
    advanceSetup()
  }

  function openConnectModal(stageId: string) {
    connectStageId.value = stageId
    connectModalOpen.value = true
  }

  function closeConnectModal() {
    connectModalOpen.value = false
    connectStageId.value = null
  }

  function connectSite(siteData: { id: string; name: string; url: string; provider: 'wpcom' | 'pressable' }) {
    const stage = site.value?.pipeline?.find(s => s.id === connectStageId.value)
    if (stage) {
      stage.site = {
        id: siteData.id,
        name: siteData.name,
        url: siteData.url,
        provider: siteData.provider,
      }
    }
    closeConnectModal()
    // Advance setup if we're in setup mode
    if (setupPhase.value !== null) {
      advanceSetup()
    }
  }

  function disconnectSite(stageId: string) {
    const stage = site.value?.pipeline?.find(s => s.id === stageId)
    if (stage) stage.site = undefined
  }

  function openSyncModal(verb: 'push' | 'pull' | 'promote', fromStage: string, toStage: string, mode: 'push' | 'sync' = 'push') {
    syncAction.value = { verb, fromStage, toStage }
    syncMode.value = mode
    syncProgress.value = { phase: 'idle', percent: 0, label: '' }
    syncModalOpen.value = true
  }

  function closeSyncModal() {
    syncModalOpen.value = false
    // Don't clear syncAction or syncProgress here — sync may still be running
    // and StageCard needs them to show progress
  }

  function resetSync() {
    syncAction.value = null
    syncProgress.value = { phase: 'idle', percent: 0, label: '' }
  }

  function startSync() {
    const categories = ['Plugins', 'Themes', 'Uploads', 'Database']
    const verb = syncAction.value?.verb === 'pull' ? 'Pulling' : 'Pushing'
    let step = 0
    syncProgress.value = { phase: 'syncing', percent: 0, label: `${verb} ${categories[0]}...` }

    const interval = setInterval(() => {
      step++
      const percent = Math.min(Math.round((step / (categories.length * 3)) * 100), 100)
      const catIndex = Math.min(Math.floor(step / 3), categories.length - 1)
      syncProgress.value = {
        phase: 'syncing',
        percent,
        label: `${verb} ${categories[catIndex]}...`,
      }
      if (percent >= 100) {
        clearInterval(interval)
        const verb = syncAction.value?.verb === 'pull' ? 'Pulled' : 'Pushed'
        syncProgress.value = { phase: 'done', percent: 100, label: verb, doneAt: Date.now(), doneVerb: verb }
        if (syncAction.value) {
          // For pull, the remote stage is fromStage; for push/promote, it's toStage
          const stageId = syncAction.value.verb === 'pull'
            ? syncAction.value.fromStage
            : syncAction.value.toStage
          const stage = site.value?.pipeline?.find(s => s.id === stageId)
          if (stage?.site) {
            if (syncAction.value.verb === 'pull') {
              stage.site.lastPullAt = new Date().toISOString()
            } else {
              stage.site.lastPushAt = new Date().toISOString()
            }
          }
        }
      }
    }, 250)
  }

  return {
    pipeline,
    hasPipeline,
    setupPhase,
    skipSetupStep,
    syncModalOpen,
    syncMode,
    syncAction,
    syncProgress,
    connectModalOpen,
    connectStageId,
    setupDefaultPipeline,
    connectSite,
    disconnectSite,
    openConnectModal,
    closeConnectModal,
    openSyncModal,
    closeSyncModal,
    startSync,
    resetSync,
  }
}
