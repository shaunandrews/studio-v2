<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useSites } from '@/data/useSites'
import { usePipeline } from '@/data/usePipeline'
import SyncEmptyState from './sync/SyncEmptyState.vue'
import SyncPipeline from './sync/SyncPipeline.vue'
import SyncModal from './sync/SyncModal.vue'
import ConnectSiteModal from './sync/ConnectSiteModal.vue'
import type { WpcomSite } from './sync/ConnectSiteModal.vue'

const props = defineProps<{
  siteId: string
}>()

const siteIdRef = toRef(props, 'siteId')
const { sites } = useSites()
const {
  hasPipeline,
  syncModalOpen,
  syncMode,
  syncAction,
  connectModalOpen,
  connectStageId,
  setupDefaultPipeline,
  connectSite,
  openConnectModal,
  closeConnectModal,
  closeSyncModal,
  startSync,
  pipeline,
} = usePipeline(siteIdRef)

const site = computed(() => sites.value.find(p => p.id === props.siteId))

const syncActionLabel = computed(() => {
  if (!syncAction.value) return ''
  const { verb, fromStage, toStage } = syncAction.value
  if (verb === 'pull') {
    const stage = pipeline.value.find(s => s.id === fromStage)
    return `Pull from ${stage?.label ?? 'Remote'}`
  }
  const stage = pipeline.value.find(s => s.id === toStage)
  const verbLabel = verb === 'push' ? 'Push to' : 'Promote to'
  return `${verbLabel} ${stage?.label ?? 'Remote'}`
})

const syncSourceLabel = computed(() => {
  if (!syncAction.value) return 'Local'
  if (syncAction.value.verb === 'pull') {
    return pipeline.value.find(s => s.id === syncAction.value!.fromStage)?.label ?? 'Remote'
  }
  return syncAction.value.fromStage === 'local' ? 'Local' : (pipeline.value.find(s => s.id === syncAction.value!.fromStage)?.label ?? 'Local')
})

const syncSourceUrl = computed(() => {
  if (!syncAction.value) return site.value?.url ?? 'localhost'
  if (syncAction.value.verb === 'pull') {
    return pipeline.value.find(s => s.id === syncAction.value!.fromStage)?.site?.url
  }
  return syncAction.value.fromStage === 'local' ? (site.value?.url ?? 'localhost') : pipeline.value.find(s => s.id === syncAction.value!.fromStage)?.site?.url
})

const syncDestLabel = computed(() => {
  if (!syncAction.value) return 'Staging'
  if (syncAction.value.verb === 'pull') return 'Local'
  return pipeline.value.find(s => s.id === syncAction.value!.toStage)?.label ?? 'Remote'
})

const syncDestUrl = computed(() => {
  if (!syncAction.value) return undefined
  if (syncAction.value.verb === 'pull') return site.value?.url ?? 'localhost'
  return pipeline.value.find(s => s.id === syncAction.value!.toStage)?.site?.url
})

const connectStage = computed(() => pipeline.value.find(s => s.id === connectStageId.value))
const connectStageLabel = computed(() => connectStage.value?.label)
const connectStageEnvironment = computed(() => connectStage.value?.environment)

const connectedSiteIds = computed(() =>
  pipeline.value.filter(s => s.site).map(s => s.site!.id)
)

function handleConnect(site: WpcomSite) {
  connectSite({ id: site.id, name: site.name, url: site.url, provider: site.provider })
}

const connectedEnvironments = computed(() =>
  pipeline.value
    .filter(s => s.site)
    .map(s => ({ id: s.id, label: s.label, url: s.site!.url }))
)

function handleSync() {
  startSync()
  closeSyncModal()
}

function handleSyncFromCard(payload: { verb: 'push' | 'pull'; envId: string }) {
  // Update syncAction with the user's choices from the sync modal
  if (payload.verb === 'pull') {
    syncAction.value = { verb: 'pull', fromStage: payload.envId, toStage: 'local' }
  } else {
    syncAction.value = { verb: 'push', fromStage: 'local', toStage: payload.envId }
  }
  startSync()
  closeSyncModal()
}
</script>

<template>
  <div class="sync-screen">
    <SyncEmptyState v-if="!hasPipeline" @setup="setupDefaultPipeline" />
    <SyncPipeline
      v-else
      :site-id="siteId"
      :site-status="site?.status ?? 'stopped'"
      :site-url="site?.url ?? 'localhost'"
    />
    <ConnectSiteModal
      :open="connectModalOpen"
      :site-name="site?.name"
      :stage-label="connectStageLabel"
      :stage-environment="connectStageEnvironment"
      :connected-site-ids="connectedSiteIds"
      @close="closeConnectModal"
      @select="handleConnect"
    />
    <SyncModal
      :open="syncModalOpen"
      :action-label="syncActionLabel"
      :verb="syncAction?.verb ?? 'push'"
      :mode="syncMode"
      :source-label="syncSourceLabel"
      :source-url="syncSourceUrl"
      :dest-label="syncDestLabel"
      :dest-url="syncDestUrl"
      :default-env-id="syncAction?.fromStage"
      :environments="connectedEnvironments"
      :local-url="site?.url ?? 'localhost'"
      @close="closeSyncModal"
      @start="handleSync"
      @start-sync="handleSyncFromCard"
    />
  </div>
</template>

<style scoped>
.sync-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
</style>
