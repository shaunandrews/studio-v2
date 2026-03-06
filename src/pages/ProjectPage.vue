<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteToolbar from '@/components/composites/SiteToolbar.vue'
import ChatList from '@/components/features/ChatList.vue'
import ChatMessageList from '@shared/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import SyncScreen from '@/components/features/SyncScreen.vue'
import PreviewsScreen from '@/components/features/PreviewsScreen.vue'
import ImportExportScreen from '@/components/features/ImportExportScreen.vue'
import ProjectSettingsScreen from '@/components/features/ProjectSettingsScreen.vue'
import PreferencesModal from '@/components/composites/PreferencesModal.vue'
import { useProjects, ALL_SITES_ID } from '@/data/useProjects'
import { useConversations } from '@/data/useConversations'
import { useInputActions } from '@/data/useInputActions'
import type { ActionButton, Conversation } from '@/data/types'

defineProps<{
  sidebarHidden?: boolean
}>()

const route = useRoute()
const router = useRouter()
const { projects, activeProjectId, setStatus } = useProjects()

const loadingTarget = ref<'running' | 'stopped'>('running')

function toggleStatus() {
  if (!currentProject.value || currentProject.value.status === 'loading') return
  const target = currentProject.value.status === 'running' ? 'stopped' : 'running'
  loadingTarget.value = target
  setStatus(currentProject.value.id, 'loading')
  setTimeout(() => setStatus(currentProject.value!.id, target), 1200)
}
const { conversations, getConversations, getMessages, sendMessage, streamAgentMessage, ensureConversation } = useConversations()
const { getActions, clearActions } = useInputActions()

const currentProject = computed(() =>
  projects.value.find(p => p.id === activeProjectId.value)
)

const isAllSites = computed(() => route.name === 'all-sites')

watch(() => route.name === 'all-sites' ? ALL_SITES_ID : route.params.id as string, (newId) => {
  activeProjectId.value = newId
}, { immediate: true })

onBeforeUnmount(() => {
  activeProjectId.value = null
})

// -- Screen state (derived from route) --

type Screen = 'tasks' | 'sync' | 'previews' | 'import-export' | 'settings'

const ROUTE_TO_SCREEN: Record<string, Screen> = {
  'project-tasks': 'tasks',
  'project-task': 'tasks',
  'project-sync': 'sync',
  'project-previews': 'previews',
  'project-import-export': 'import-export',
  'project-settings': 'settings',
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
  [() => route.name, () => activeProjectId.value],
  ([routeName, projectId]) => {
    if (routeName !== 'project-tasks' || !projectId) return
    const convos = conversations.value
      .filter(c => c.projectId === projectId && !c.archived)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const firstId = convos[0]?.id
    if (firstId) {
      router.replace({ name: 'project-task', params: { id: projectId, convoId: firstId } })
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
  const id = activeProjectId.value
  if (!id) return
  const routeName = screen === 'tasks' ? 'project-tasks' : `project-${screen}`
  router.push({ name: routeName, params: { id } })
}

function onSelectChat(convoId: string) {
  const id = activeProjectId.value
  if (!id) return
  draft.value = ''
  router.push({ name: 'project-task', params: { id, convoId } })
  nextTick(() => inputChatRef.value?.focus())
}

function onNewChat() {
  const projectId = activeProjectId.value
  if (!projectId) return
  const conv: Conversation = {
    id: `conv-${Date.now()}`,
    projectId,
    agentId: 'assistant',
    createdAt: new Date().toISOString(),
  }
  conversations.value.push(conv)
  draft.value = ''
  router.push({ name: 'project-task', params: { id: projectId, convoId: conv.id } })
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
  <div class="project-page vstack">
    <!-- Nested route outlet (children render null — ProjectPage owns the layout) -->
    <router-view />
    <SiteToolbar
      v-if="currentProject || isAllSites"
      :title="isAllSites ? 'All Sites' : currentProject!.name"
      :project-id="isAllSites ? undefined : currentProject!.id"
      :favicon="isAllSites ? undefined : currentProject!.favicon"
      :status="isAllSites ? undefined : currentProject!.status"
      :sidebar-hidden="sidebarHidden"
      :is-all-sites="isAllSites"
      :loading-target="loadingTarget"
      @toggle-status="toggleStatus"
      @switch-project="(id) => {
        const screen = currentScreen === 'tasks' ? 'project-tasks' : `project-${currentScreen}`
        router.push({ name: screen, params: { id } })
      }"
    />
    <div class="panes">
      <div class="pane pane-chat">
        <ChatList
          v-if="activeProjectId"
          :project-id="activeProjectId"
          :selected-id="currentScreen === 'tasks' ? selectedConvoId : null"
          :active-screen="currentScreen"
          :site-name="isAllSites ? 'All Sites' : currentProject?.name"
          :site-favicon="isAllSites ? undefined : currentProject?.favicon"
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
          <ChatMessageList v-else :messages="currentMessages" :project-id="activeProjectId ?? undefined" :style="{ paddingBlockEnd: inputHeight + 'px' }" />
          <div ref="inputWrapRef" class="detail-input" :class="{ 'is-new-task': isNewTask }">
            <InputChat
              ref="inputChatRef"
              v-model="draft"
              :project-id="activeProjectId"
              :placeholder="isNewTask ? 'Describe what this task should do...' : 'Ask anything...'"
              :actions="inputActions"
              @send="onSend"
              @action="onAction"
              @manage-agents="showPreferences = true"
            />
          </div>
        </template>
        <SyncScreen v-else-if="!isAllSites && currentScreen === 'sync'" :project-id="activeProjectId!" />
        <PreviewsScreen v-else-if="!isAllSites && currentScreen === 'previews'" :project-id="activeProjectId!" />
        <ImportExportScreen v-else-if="!isAllSites && currentScreen === 'import-export'" :project-id="activeProjectId!" />
        <ProjectSettingsScreen v-else-if="!isAllSites && currentScreen === 'settings'" :project-id="activeProjectId!" />
        <div v-else class="detail-empty">
          <span class="detail-empty__text">Select a task or start a new one</span>
        </div>
      </div>
    </div>

    <PreferencesModal :open="showPreferences" @close="showPreferences = false" />
  </div>
</template>

<style scoped>
.project-page {
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

.pane-chat {
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
  padding: var(--space-s) 0;
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
  color: var(--color-frame-fg-secondary);
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
