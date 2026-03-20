<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteNavigation from '@/components/features/SiteNavigation.vue'
import ChatMessageList from '@/components/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'
import ResizeHandle from '@/components/primitives/ResizeHandle.vue'
import TaskBrief from '@/components/composites/task-brief/TaskBrief.vue'
import SyncScreen from '@/components/features/SyncScreen.vue'
import PreviewsScreen from '@/components/features/PreviewsScreen.vue'
import SiteSettingsScreen from '@/components/features/SiteSettingsScreen.vue'
import SiteOverviewScreen from '@/components/features/SiteOverviewScreen.vue'
import SiteMapScreen from '@/components/features/SiteMapScreen.vue'
import { useSettings } from '@/data/useSettings'
import { useSites, ALL_SITES_ID } from '@/data/useSites'
import { useResizablePane } from '@/data/useResizablePane'
import { useTasks } from '@/data/useTasks'
import { useSiteDocument } from '@/data/useSiteDocument'
import { usePreviewSync } from '@/data/usePreviewSync'
import { renderSite } from '@/data/site-renderer'

defineProps<{
  sidebarHidden?: boolean
}>()

const route = useRoute()
const router = useRouter()
const { sites, activeSiteId, setStatus } = useSites()

const loadingTarget = ref<'running' | 'stopped'>('running')

let statusTimer: ReturnType<typeof setTimeout> | null = null

function toggleStatus() {
  if (!currentSite.value || currentSite.value.status === 'loading') return
  const target = currentSite.value.status === 'running' ? 'stopped' : 'running'
  loadingTarget.value = target
  setStatus(currentSite.value.id, 'loading')
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    setStatus(currentSite.value!.id, target)
    statusTimer = null
  }, 1200)
}
const { tasks, getTasksForSite, getMessages, sendMessage, streamAgentMessage, createTask, generateTaskTitle, markRead } = useTasks()

const currentSite = computed(() =>
  sites.value.find(p => p.id === activeSiteId.value)
)

const isAllSites = computed(() => route.name === 'all-sites')

watch(() => route.name === 'all-sites' ? ALL_SITES_ID : route.params.id as string, (newId) => {
  activeSiteId.value = newId
}, { immediate: true })

onBeforeUnmount(() => {
  activeSiteId.value = null
  if (statusTimer) clearTimeout(statusTimer)
})

// -- Screen state (derived from route) --

type Screen = 'overview' | 'sitemap' | 'tasks' | 'sync' | 'previews' | 'settings'

const ROUTE_TO_SCREEN: Record<string, Screen> = {
  'site-overview': 'overview',
  'site-sitemap': 'sitemap',
  'site-tasks': 'tasks',
  'site-task': 'tasks',
  'site-sync': 'sync',
  'site-previews': 'previews',
  'site-settings': 'settings',
}

const currentScreen = computed<Screen>(() =>
  ROUTE_TO_SCREEN[route.name as string] ?? 'overview'
)

// -- Selection state (derived from route) --

const selectedTaskId = computed<string | null>(() =>
  route.params.taskId as string ?? null
)

// Auto-select first task when landing on bare tasks route
watch(
  [() => route.name, () => activeSiteId.value],
  ([routeName, siteId]) => {
    if (routeName !== 'site-tasks' || !siteId) return
    const siteTasks = tasks.value
      .filter(t => t.siteId === siteId && !t.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const firstId = siteTasks[0]?.id
    if (firstId) {
      router.replace({ name: 'site-task', params: { id: siteId, taskId: firstId } })
    }
  },
  { immediate: true },
)

const currentMessages = getMessages(selectedTaskId)
const isNewTask = computed(() =>
  selectedTaskId.value != null && currentMessages.value.length === 0
)

const selectedTask = computed(() =>
  tasks.value.find(t => t.id === selectedTaskId.value)
)
const isReview = computed(() => selectedTask.value?.status === 'review')

function approveAndMerge() {
  if (!selectedTask.value) return
  selectedTask.value.status = 'approved'
}

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
const isAtTop = ref(true)

function onNavigate(screen: string) {
  const id = activeSiteId.value
  if (!id) return
  const routeName = screen === 'tasks' ? 'site-tasks' : `site-${screen}`
  router.push({ name: routeName, params: { id } })
}

function onSelectChat(taskId: string) {
  const id = activeSiteId.value
  if (!id) return
  draft.value = ''
  markRead(taskId)
  router.push({ name: 'site-task', params: { id, taskId } })
  nextTick(() => inputChatRef.value?.focus())
}

async function onNewChat() {
  const siteId = activeSiteId.value
  if (!siteId) return
  const task = await createTask({
    siteId,
    origin: { surface: 'chat' },
  })
  draft.value = ''
  router.push({ name: 'site-task', params: { id: siteId, taskId: task.id } })
  nextTick(() => inputChatRef.value?.focus())
}

function onSend(text: string) {
  if (!selectedTaskId.value) return
  const isFirst = isNewTask.value
  sendMessage(selectedTaskId.value, text)
  draft.value = ''
  if (isFirst) {
    generateTaskTitle(selectedTaskId.value, text)
  }
}

const { width: navWidth, isDragging: isResizing, onPointerDown: onResizeStart, resetWidth: resetNavWidth } = useResizablePane({
  defaultWidth: 275,
  minWidth: 180,
  maxWidth: 480,
  storageKey: 'studio-nav-width',
})

const { openSettings } = useSettings()

// ── Site preview ──

const { getContent } = useSiteDocument()
const { registerIframe, unregisterIframe } = usePreviewSync()

const previewIframeRef = ref<HTMLIFrameElement | null>(null)
const currentPageSlug = ref('/')

const previewHtml = computed(() => {
  if (!activeSiteId.value) return ''
  const content = getContent(activeSiteId.value).value
  if (!content) return ''
  return renderSite(content, currentPageSlug.value)
})

watch(previewIframeRef, (el) => {
  if (el) registerIframe(el)
})

function onIframeMessage(event: MessageEvent) {
  if (event.data?.type === 'navigate') {
    currentPageSlug.value = event.data.page
  }
}

onMounted(() => window.addEventListener('message', onIframeMessage))
onBeforeUnmount(() => {
  window.removeEventListener('message', onIframeMessage)
  unregisterIframe()
})

</script>

<template>
  <div class="site-page vstack">
    <!-- Nested route outlet (children render null — SitePage owns the layout) -->
    <router-view />
    <div class="panes" :class="{ 'is-resizing': isResizing }">
      <div class="pane pane-site-navigation" :style="{ width: navWidth + 'px' }">
        <SiteNavigation
          v-if="activeSiteId"
          :site-id="activeSiteId"
          :selected-id="currentScreen === 'tasks' ? selectedTaskId : null"
          :active-screen="currentScreen"
          :site-favicon="isAllSites ? undefined : currentSite?.favicon"
          :is-all-sites="isAllSites"
          :sidebar-hidden="sidebarHidden"
          @select="onSelectChat"
          @new-task="onNewChat"
          @navigate="onNavigate"
          @switch-site="(id) => {
            const screen = currentScreen === 'tasks' ? 'site-tasks' : `site-${currentScreen}`
            router.push({ name: screen, params: { id } })
          }"
          @navigate-all-sites="router.push({ name: 'all-sites' })"
        />
      </div>
      <ResizeHandle :is-dragging="isResizing" @pointerdown="onResizeStart" @dblclick="resetNavWidth" />
      <div class="pane pane-detail">
        <SiteOverviewScreen v-if="!isAllSites && currentScreen === 'overview'" :site-id="activeSiteId!" :status="currentSite?.status" :loading-target="loadingTarget" @toggle-status="toggleStatus" />
        <SiteMapScreen v-else-if="!isAllSites && currentScreen === 'sitemap'" :site-id="activeSiteId!" />
        <template v-else-if="currentScreen === 'tasks' && selectedTaskId">
          <TaskBrief
            v-if="!isNewTask"
            :task-id="selectedTaskId"
            :elevated="!isAtTop"
            class="task-brief-panel"
            @preview="(id) => { /* TODO: open preview */ }"
          />
          <ChatMessageList v-if="!isNewTask" :messages="currentMessages" :site-id="activeSiteId ?? undefined" :style="{ paddingBlockEnd: inputHeight + 'px' }" @scroll-state="(atBottom) => isScrolledUp = !atBottom" @scroll-top="(atTop) => isAtTop = atTop" />
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
                  <Text tag="p" color="muted">An AI assistant can complete your task for you. Then you can review and approve the changes, merging them into your main Studio site.</Text>
                </div>
              </div>
            </Transition>
            <ProgressiveBlur v-if="!isNewTask" class="input-blur" height="calc(100% + 6px)" />
            <div v-if="isReview" class="merge-banner">
              <Text variant="body-small" color="muted">This task is ready for your review.</Text>
              <Button label="Approve & merge" variant="primary" size="small" @click="approveAndMerge" />
            </div>
            <InputChat
              ref="inputChatRef"
              v-model="draft"
              :site-id="activeSiteId"
              :elevated="isScrolledUp"
              :placeholder="isNewTask ? 'Describe what this task should do...' : 'Ask anything...'"
              @send="onSend"
              @manage-agents="openSettings('agents')"
            />
          </div>
        </template>
        <SyncScreen v-else-if="!isAllSites && currentScreen === 'sync'" :site-id="activeSiteId!" />
        <PreviewsScreen v-else-if="!isAllSites && currentScreen === 'previews'" :site-id="activeSiteId!" />
        <SiteSettingsScreen v-else-if="!isAllSites && currentScreen === 'settings'" :site-id="activeSiteId!" @manage-global-skills="openSettings('skills')" />
        <div v-else class="detail-empty">
          <span class="detail-empty__text">Select a task or start a new one</span>
        </div>
      </div>
      <div v-if="currentScreen === 'tasks' && selectedTaskId" class="pane pane-preview">
        <iframe
          ref="previewIframeRef"
          :srcdoc="previewHtml"
          class="preview-iframe"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>

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
  flex: 0 0 auto;
}

.panes.is-resizing {
  user-select: none;
  cursor: col-resize;
}

.pane-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.pane-preview {
  flex: 1;
  min-width: 0;
  border-inline-start: 1px solid var(--color-frame-border);
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.task-brief-panel {
  flex-shrink: 0;
  margin: var(--space-s);
  margin-block-end: 0;
}

.detail-input {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  width: 100%;
  padding: var(--space-xl) 0 var(--space-m);
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

/* -- Merge banner -- */

.merge-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 580px;
  padding: var(--space-xs) var(--space-s);
  background: color-mix(in srgb, var(--color-frame-fill) 70%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  margin-block-end: var(--space-xs);
}

/* -- Progressive blur behind input -- */

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

/* -- New task welcome -- */

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

/* -- New task illustration -- */

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
