<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteToolbar from '@/components/composites/SiteToolbar.vue'
import SiteNavigation from '@/components/features/SiteNavigation.vue'
import ChatMessageList from '@/components/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import SyncScreen from '@/components/features/SyncScreen.vue'
import PreviewsScreen from '@/components/features/PreviewsScreen.vue'
import ImportExportScreen from '@/components/features/ImportExportScreen.vue'
import SiteSettingsScreen from '@/components/features/SiteSettingsScreen.vue'
import PreferencesModal from '@/components/composites/PreferencesModal.vue'
import { useSites, ALL_SITES_ID } from '@/data/useSites'
import { useConversations } from '@/data/useConversations'
import { useInputActions } from '@/data/useInputActions'
import type { ActionButton, Conversation } from '@/data/types'

defineProps<{
  sidebarHidden?: boolean
}>()

const route = useRoute()
const router = useRouter()
const { sites, activeSiteId, setStatus } = useSites()

const loadingTarget = ref<'running' | 'stopped'>('running')

function toggleStatus() {
  if (!currentSite.value || currentSite.value.status === 'loading') return
  const target = currentSite.value.status === 'running' ? 'stopped' : 'running'
  loadingTarget.value = target
  setStatus(currentSite.value.id, 'loading')
  setTimeout(() => setStatus(currentSite.value!.id, target), 1200)
}
const { conversations, getConversations, getMessages, sendMessage, streamAgentMessage, ensureConversation } = useConversations()
const { getActions, clearActions } = useInputActions()

const currentSite = computed(() =>
  sites.value.find(p => p.id === activeSiteId.value)
)

const isAllSites = computed(() => route.name === 'all-sites')

watch(() => route.name === 'all-sites' ? ALL_SITES_ID : route.params.id as string, (newId) => {
  activeSiteId.value = newId
}, { immediate: true })

onBeforeUnmount(() => {
  activeSiteId.value = null
})

// -- Screen state (derived from route) --

type Screen = 'tasks' | 'sync' | 'previews' | 'import-export' | 'settings'

const ROUTE_TO_SCREEN: Record<string, Screen> = {
  'site-tasks': 'tasks',
  'site-task': 'tasks',
  'site-sync': 'sync',
  'site-previews': 'previews',
  'site-import-export': 'import-export',
  'site-settings': 'settings',
}

const currentScreen = computed<Screen>(() =>
  ROUTE_TO_SCREEN[route.name as string] ?? 'tasks'
)

// -- Selection state (derived from route) --

const selectedConvoId = computed<string | null>(() =>
  route.params.convoId as string ?? null
)

// Auto-select first conversation when landing on bare tasks route
watch(
  [() => route.name, () => activeSiteId.value],
  ([routeName, siteId]) => {
    if (routeName !== 'site-tasks' || !siteId) return
    const convos = conversations.value
      .filter(c => c.siteId === siteId && !c.archived)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const firstId = convos[0]?.id
    if (firstId) {
      router.replace({ name: 'site-task', params: { id: siteId, convoId: firstId } })
    }
  },
  { immediate: true },
)

const currentMessages = getMessages(selectedConvoId)
const inputActions = getActions(selectedConvoId)

const isNewTask = computed(() =>
  selectedConvoId.value != null && currentMessages.value.length === 0
)

const inputChatRef = ref<InstanceType<typeof InputChat> | null>(null)
const inputWrapRef = ref<HTMLDivElement | null>(null)
const inputHeight = ref(0)
let inputResizeObserver: ResizeObserver | null = null

watch(inputWrapRef, (el, _, onCleanup) => {
  if (!el) return
  inputHeight.value = el.offsetHeight
  inputResizeObserver = new ResizeObserver(() => {
    inputHeight.value = el.offsetHeight
  })
  inputResizeObserver.observe(el)
  onCleanup(() => inputResizeObserver?.disconnect())
})

const draft = ref('')

function onNavigate(screen: string) {
  const id = activeSiteId.value
  if (!id) return
  const routeName = screen === 'tasks' ? 'site-tasks' : `site-${screen}`
  router.push({ name: routeName, params: { id } })
}

function onSelectChat(convoId: string) {
  const id = activeSiteId.value
  if (!id) return
  draft.value = ''
  router.push({ name: 'site-task', params: { id, convoId } })
  nextTick(() => inputChatRef.value?.focus())
}

function onNewChat() {
  const siteId = activeSiteId.value
  if (!siteId) return
  const conv: Conversation = {
    id: `conv-${Date.now()}`,
    siteId,
    agentId: 'assistant',
    createdAt: new Date().toISOString(),
  }
  conversations.value.push(conv)
  draft.value = ''
  router.push({ name: 'site-task', params: { id: siteId, convoId: conv.id } })
  nextTick(() => inputChatRef.value?.focus())
}

function onSend(text: string) {
  if (!selectedConvoId.value) return
  clearActions(selectedConvoId.value)
  sendMessage(selectedConvoId.value, 'user', text, undefined, { source: 'typed' })
  draft.value = ''
}

const showPreferences = ref(false)

function onAction(action: ActionButton) {
  if (!selectedConvoId.value) return
  clearActions(selectedConvoId.value)
  sendMessage(
    selectedConvoId.value,
    'user',
    action.action.message,
    undefined,
    {
      source: 'action',
      actionId: action.id,
      cardRef: action.action.cardRef,
      payload: action.action.payload,
    },
  )
}
</script>

<template>
  <div class="site-page vstack">
    <!-- Nested route outlet (children render null — SitePage owns the layout) -->
    <router-view />
    <SiteToolbar
      v-if="currentSite || isAllSites"
      :title="isAllSites ? 'All Sites' : currentSite!.name"
      :site-id="isAllSites ? undefined : currentSite!.id"
      :favicon="isAllSites ? undefined : currentSite!.favicon"
      :status="isAllSites ? undefined : currentSite!.status"
      :sidebar-hidden="sidebarHidden"
      :is-all-sites="isAllSites"
      :loading-target="loadingTarget"
      @toggle-status="toggleStatus"
      @switch-site="(id) => {
        const screen = currentScreen === 'tasks' ? 'site-tasks' : `site-${currentScreen}`
        router.push({ name: screen, params: { id } })
      }"
    />
    <div class="panes">
      <div class="pane pane-site-navigation">
        <SiteNavigation
          v-if="activeSiteId"
          :site-id="activeSiteId"
          :selected-id="currentScreen === 'tasks' ? selectedConvoId : null"
          :active-screen="currentScreen"
          :site-name="isAllSites ? 'All Sites' : currentSite?.name"
          :site-favicon="isAllSites ? undefined : currentSite?.favicon"
          :is-all-sites="isAllSites"
          :sidebar-hidden="sidebarHidden"
          @select="onSelectChat"
          @new-task="onNewChat"
          @navigate="onNavigate"
        />
      </div>
      <div class="pane pane-detail">
        <template v-if="currentScreen === 'tasks' && selectedConvoId">
          <div v-if="isNewTask" class="new-task-welcome" :style="{ paddingBlockEnd: inputHeight + 'px' }">
            <div class="new-task-welcome__content">
              <p class="new-task-welcome__heading">What should this task do?</p>
              <p class="new-task-welcome__description">A task is an AI agent that works on your site. Describe what you need and it'll get to work.</p>
              <ul class="new-task-welcome__examples">
                <li>Add a contact form to the homepage</li>
                <li>Write a blog post about our new menu</li>
                <li>Install and configure an SEO plugin</li>
                <li>Change the header font to something bolder</li>
              </ul>
            </div>
          </div>
          <ChatMessageList v-else :messages="currentMessages" :site-id="activeSiteId ?? undefined" :style="{ paddingBlockEnd: inputHeight + 'px' }" />
          <div ref="inputWrapRef" class="detail-input" :class="{ 'is-new-task': isNewTask }">
            <InputChat
              ref="inputChatRef"
              v-model="draft"
              :site-id="activeSiteId"
              :placeholder="isNewTask ? 'Describe what this task should do...' : 'Ask anything...'"
              :actions="inputActions"
              @send="onSend"
              @action="onAction"
              @manage-agents="showPreferences = true"
            />
          </div>
        </template>
        <SyncScreen v-else-if="!isAllSites && currentScreen === 'sync'" :site-id="activeSiteId!" />
        <PreviewsScreen v-else-if="!isAllSites && currentScreen === 'previews'" :site-id="activeSiteId!" />
        <ImportExportScreen v-else-if="!isAllSites && currentScreen === 'import-export'" :site-id="activeSiteId!" />
        <SiteSettingsScreen v-else-if="!isAllSites && currentScreen === 'settings'" :site-id="activeSiteId!" />
        <div v-else class="detail-empty">
          <span class="detail-empty__text">Select a task or start a new one</span>
        </div>
      </div>
    </div>

    <PreferencesModal :open="showPreferences" @close="showPreferences = false" />
  </div>
</template>

<style scoped>
.site-page {
  height: 100%;
}

.panes {
  display: flex;
  flex: 1;
  min-height: 0;
}

.pane {
  overflow: hidden;
}

.pane-site-navigation {
  flex: 0 0 333px;
  border-inline-end: 1px solid var(--color-frame-border);
}

.pane-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.detail-input {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  max-width: 720px;
  width: 100%;
  margin-inline: auto;
  padding: var(--space-m) 0;
  z-index: 1;
}

.detail-input.is-new-task {
  max-width: 600px;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

.new-task-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.new-task-welcome__content {
  max-width: 360px;
  text-align: center;
}

.new-task-welcome__heading {
  margin: 0 0 var(--space-xs);
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  line-height: 1.3;
}

.new-task-welcome__description {
  margin: 0 0 var(--space-m);
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
}

.new-task-welcome__examples {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.new-task-welcome__examples li {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

.new-task-welcome__examples li::before {
  content: '\201C';
  color: var(--color-frame-fg-muted);
}

.new-task-welcome__examples li::after {
  content: '\201D';
  color: var(--color-frame-fg-muted);
}
</style>
