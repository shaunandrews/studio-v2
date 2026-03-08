<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteToolbar from '@/components/composites/SiteToolbar.vue'
import SiteNavigation from '@/components/features/SiteNavigation.vue'
import ChatMessageList from '@/components/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import Text from '@/components/primitives/Text.vue'
import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'
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
const { conversations, getConversations, getMessages, sendMessage, streamAgentMessage, ensureConversation, generateTaskTitle } = useConversations()
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
const isScrolledUp = ref(false)

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
  const isFirst = isNewTask.value
  clearActions(selectedConvoId.value)
  sendMessage(selectedConvoId.value, 'user', text, undefined, { source: 'typed' })
  draft.value = ''
  if (isFirst) {
    generateTaskTitle(selectedConvoId.value, text)
  }
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
          <ChatMessageList v-if="!isNewTask" :messages="currentMessages" :site-id="activeSiteId ?? undefined" :style="{ paddingBlockEnd: inputHeight + 'px' }" @scroll-state="(atBottom) => isScrolledUp = !atBottom" />
          <div ref="inputWrapRef" class="detail-input" :class="{ 'is-new-task': isNewTask }">
            <Transition name="welcome-fade">
              <div v-if="isNewTask" class="new-task-welcome">
                <div class="new-task-illustration" aria-hidden="true">
                  <div class="new-task-illustration__user" />
                  <div class="new-task-illustration__agent" />
                  <div class="new-task-illustration__user" />
                </div>
                <div class="new-task-welcome__copy">
                  <Text tag="p" variant="body-large" weight="semibold">New task</Text>
                  <Text tag="p" color="muted">Describe what you need and an AI agent will get to work on your site.</Text>
                </div>
              </div>
            </Transition>
            <ProgressiveBlur v-if="!isNewTask" class="input-blur" height="calc(100% + 6px)" />
            <InputChat
              ref="inputChatRef"
              v-model="draft"
              :site-id="activeSiteId"
              :elevated="isScrolledUp"
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
  width: 100%;
  padding: var(--space-m) 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: inset-block-end var(--duration-slow) cubic-bezier(0.22, 1, 0.36, 1),
    transform var(--duration-slow) cubic-bezier(0.22, 1, 0.36, 1);
}

.detail-input.is-new-task {
  inset-block-end: 50%;
  transform: translateY(50%);
  padding: 0;
}

/* ── Progressive blur behind input ── */

.input-blur {
  inset-inline-start: calc(-1 * var(--space-xl));
  inset-inline-end: 16px;
  z-index: -1;
}

.detail-input.is-new-task :deep(.input-chat) {
  max-width: 500px;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

/* ── New task welcome ── */

.new-task-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-l);
  padding-block-end: var(--space-l);
  max-width: 360px;
}

.new-task-welcome__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
  text-align: center;
}

/* Welcome fade transition */
.welcome-fade-leave-active {
  transition: opacity var(--duration-slow) var(--ease-default),
    transform var(--duration-slow) var(--ease-default);
}

.welcome-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── New task illustration ── */

.new-task-illustration {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 260px;
  height: 140px;
  flex-shrink: 0;
  overflow: hidden;
}

.new-task-illustration__user,
.new-task-illustration__agent {
  max-height: 0;
  opacity: 0;
  margin-block-start: 0;
  animation: bubble-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.new-task-illustration__user {
  align-self: flex-end;
  width: 140px;
  height: 32px;
  border-start-start-radius: var(--radius-xl);
  border-start-end-radius: var(--radius-xl);
  border-end-start-radius: var(--radius-xl);
  border-end-end-radius: var(--radius-s);
  background: var(--color-frame-hover);
}

.new-task-illustration__agent {
  align-self: flex-start;
  width: 180px;
  height: 48px;
  border-radius: var(--radius-l);
  background: var(--color-frame-hover);
  animation-name: bubble-in-dim;
}

.new-task-illustration > :nth-child(1) {
  animation-delay: 300ms;
}

.new-task-illustration > :nth-child(2) {
  animation-delay: 800ms;
}

.new-task-illustration > :nth-child(3) {
  animation-delay: 1300ms;
}

@keyframes bubble-in {
  0% {
    max-height: 0;
    margin-block-start: 0;
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    max-height: 48px;
    margin-block-start: var(--space-m);
    opacity: 1;
  }
}

@keyframes bubble-in-dim {
  0% {
    max-height: 0;
    margin-block-start: 0;
    opacity: 0;
  }
  40% {
    opacity: 0.5;
  }
  100% {
    max-height: 48px;
    margin-block-start: var(--space-m);
    opacity: 0.5;
  }
}
</style>
