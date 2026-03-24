<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteNavigation from '@/components/features/SiteNavigation.vue'
import ChatMessageList from '@/components/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import UrlInput from '@/components/primitives/UrlInput.vue'
import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'
import ResizeHandle from '@/components/primitives/ResizeHandle.vue'
import Pane from '@/components/composites/Pane.vue'
import PaneGroup from '@/components/composites/PaneGroup.vue'
import TaskBrief from '@/components/composites/task-brief/TaskBrief.vue'
import SyncScreen from '@/components/features/SyncScreen.vue'
import PreviewsScreen from '@/components/features/PreviewsScreen.vue'
import SiteSettingsScreen from '@/components/features/SiteSettingsScreen.vue'
import SiteOverviewScreen from '@/components/features/SiteOverviewScreen.vue'
import SiteMapScreen from '@/components/features/SiteMapScreen.vue'
import { chevronLeft, chevronRight } from '@wordpress/icons'
import { useSettings } from '@/data/useSettings'
import { useSites, ALL_SITES_ID } from '@/data/useSites'
import { useResizablePane } from '@/data/useResizablePane'
import { useTasks } from '@/data/useTasks'
import { useSiteDocument } from '@/data/useSiteDocument'
import { usePreviewSync } from '@/data/usePreviewSync'
import { useRevisions } from '@/data/useRevisions'
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
const { tasks, getTasksForSite, getMessages, sendMessage, streamAgentMessage, createTask, generateTaskTitle, markRead, isBusy, stopTask } = useTasks()

const isTaskStreaming = computed(() =>
  selectedTaskId.value ? isBusy(selectedTaskId.value).value : false
)

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

const inputChatRef = ref<InstanceType<typeof InputChat> | null>(null)
const inputWrapRef = ref<HTMLDivElement | null>(null)
const inputHeight = ref(0)

watch(inputWrapRef, (el, _, onCleanup) => {
  if (!el) return
  inputHeight.value = el.offsetHeight
  const observer = new ResizeObserver(() => {
    inputHeight.value = el.offsetHeight
  })
  observer.observe(el)
  onCleanup(() => observer.disconnect())
})

const draft = ref('')
const isScrolledUp = ref(false)

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
  previewingRevisionId.value = null
  markRead(taskId)
  router.push({ name: 'site-task', params: { id, taskId } })
  nextTick(() => inputChatRef.value?.focus())
}

async function onNewChat() {
  const siteId = activeSiteId.value
  if (!siteId) return
  const task = await createTask({ siteId })
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

// ── Browser pane visibility & resize ──

const storedBrowserVisible = localStorage.getItem('studio-browser-visible')
const browserVisible = ref(storedBrowserVisible !== null ? storedBrowserVisible !== 'false' : true)

function toggleBrowser() {
  browserVisible.value = !browserVisible.value
  localStorage.setItem('studio-browser-visible', String(browserVisible.value))
}

const { width: browserWidth, isDragging: isBrowserResizing, onPointerDown: onBrowserResizeStart, resetWidth: resetBrowserWidth } = useResizablePane({
  defaultWidth: 480,
  minWidth: 300,
  maxWidth: 800,
  storageKey: 'studio-browser-width',
  invert: true,
})

// ── Browser iframe & navigation ──

const { getContent } = useSiteDocument()
const { getRevisionSnapshot } = useRevisions()
const { registerIframe, unregisterIframe } = usePreviewSync()

const previewingRevisionId = ref<string | null>(null)

function onPreviewRevision(revisionId: string) {
  previewingRevisionId.value = revisionId
  if (!browserVisible.value) browserVisible.value = true
}

function exitRevisionPreview() {
  previewingRevisionId.value = null
}

const browserIframeRef = ref<HTMLIFrameElement | null>(null)
const currentPageSlug = ref('/')

// Navigation history
const browserHistory = ref<string[]>(['/'])
const browserHistoryIndex = ref(0)
let isHistoryNavigation = false

// Reset browser state when switching sites
watch(activeSiteId, () => {
  currentPageSlug.value = '/'
  browserHistory.value = ['/']
  browserHistoryIndex.value = 0
  isHistoryNavigation = false
})

const canGoBack = computed(() => browserHistoryIndex.value > 0)
const canGoForward = computed(() => browserHistoryIndex.value < browserHistory.value.length - 1)

function goBack() {
  if (!canGoBack.value) return
  isHistoryNavigation = true
  browserHistoryIndex.value--
  currentPageSlug.value = browserHistory.value[browserHistoryIndex.value]
}

function goForward() {
  if (!canGoForward.value) return
  isHistoryNavigation = true
  browserHistoryIndex.value++
  currentPageSlug.value = browserHistory.value[browserHistoryIndex.value]
}

const browserDisplayUrl = computed(() => {
  const site = currentSite.value
  if (!site) return ''
  const base = site.url || site.name
  const slug = currentPageSlug.value === '/' ? '' : currentPageSlug.value
  return base + slug
})

const browserPages = computed(() => {
  if (!activeSiteId.value) return []
  const content = getContent(activeSiteId.value).value
  if (!content) return []
  return content.pages.map(p => ({ slug: p.slug, title: p.title }))
})

const browserHtml = computed(() => {
  if (previewingRevisionId.value) {
    const snapshot = getRevisionSnapshot(previewingRevisionId.value)
    if (snapshot) return renderSite(snapshot, currentPageSlug.value)
  }
  if (!activeSiteId.value) return ''
  const content = getContent(activeSiteId.value).value
  if (!content) return ''
  return renderSite(content, currentPageSlug.value)
})

function navigateToPage(slug: string) {
  if (slug === currentPageSlug.value) return
  browserHistory.value = browserHistory.value.slice(0, browserHistoryIndex.value + 1)
  browserHistory.value.push(slug)
  browserHistoryIndex.value = browserHistory.value.length - 1
  currentPageSlug.value = slug
}

watch(browserIframeRef, (el) => {
  if (el) registerIframe(el)
})

function onIframeMessage(event: MessageEvent) {
  if (event.data?.type === 'navigate') {
    const page = event.data.page
    currentPageSlug.value = page
    if (!isHistoryNavigation) {
      // Trim forward history and push new entry
      browserHistory.value = browserHistory.value.slice(0, browserHistoryIndex.value + 1)
      browserHistory.value.push(page)
      browserHistoryIndex.value = browserHistory.value.length - 1
    }
    isHistoryNavigation = false
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
    <PaneGroup direction="horizontal" :class="{ 'is-resizing': isResizing || isBrowserResizing }">
      <Pane fit :style="{ width: navWidth + 'px' }">
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
      </Pane>
      <ResizeHandle :is-dragging="isResizing" @pointerdown="onResizeStart" @dblclick="resetNavWidth" />

      <!-- Detail area -->
      <PaneGroup>
        <SiteOverviewScreen v-if="!isAllSites && currentScreen === 'overview'" :site-id="activeSiteId!" :status="currentSite?.status" :loading-target="loadingTarget" @toggle-status="toggleStatus" />
        <SiteMapScreen v-else-if="!isAllSites && currentScreen === 'sitemap'" :site-id="activeSiteId!" />
        <template v-else-if="currentScreen === 'tasks' && selectedTaskId">
          <Pane v-if="!isNewTask" fit>
            <TaskBrief
              :task-id="selectedTaskId"
              :browser-visible="browserVisible"
              @toggle-browser="toggleBrowser"
              @preview-revision="onPreviewRevision"
            />
          </Pane>
          <Pane v-if="!isNewTask" class="chat-pane">
            <ChatMessageList :messages="currentMessages" :site-id="activeSiteId ?? undefined" :style="{ paddingBlockEnd: inputHeight + 'px' }" @scroll-state="(atBottom) => isScrolledUp = !atBottom" />
            <div ref="inputWrapRef" class="detail-input">
              <ProgressiveBlur class="input-blur" height="calc(100% + 6px)" />
              <InputChat
                ref="inputChatRef"
                v-model="draft"
                :site-id="activeSiteId"
                :elevated="isScrolledUp"
                :streaming="isTaskStreaming"
                placeholder="Ask anything..."
                @send="onSend"
                @stop="selectedTaskId && stopTask(selectedTaskId)"
                @manage-agents="openSettings('agents')"
              />
            </div>
          </Pane>
          <Pane v-if="isNewTask" class="new-task-welcome-wrap">
            <div class="new-task-welcome">
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
            <div class="detail-input detail-input--centered">
              <InputChat
                ref="inputChatRef"
                v-model="draft"
                :site-id="activeSiteId"
                :streaming="isTaskStreaming"
                placeholder="Describe what this task should do..."
                @send="onSend"
                @stop="selectedTaskId && stopTask(selectedTaskId)"
                @manage-agents="openSettings('agents')"
              />
            </div>
          </Pane>
        </template>
        <SyncScreen v-else-if="!isAllSites && currentScreen === 'sync'" :site-id="activeSiteId!" />
        <PreviewsScreen v-else-if="!isAllSites && currentScreen === 'previews'" :site-id="activeSiteId!" />
        <SiteSettingsScreen v-else-if="!isAllSites && currentScreen === 'settings'" :site-id="activeSiteId!" @manage-global-skills="openSettings('skills')" />
        <div v-else class="detail-empty">
          <span class="detail-empty__text">Select a task or start a new one</span>
        </div>
      </PaneGroup>

      <!-- Browser pane -->
      <template v-if="currentScreen === 'tasks' && selectedTaskId && browserVisible">
        <ResizeHandle :is-dragging="isBrowserResizing" @pointerdown="onBrowserResizeStart" @dblclick="resetBrowserWidth" />
        <PaneGroup fit :style="{ width: browserWidth + 'px' }">
          <Pane fit>
            <div class="browser-toolbar">
              <Button variant="tertiary" :icon="chevronLeft" icon-only :disabled="!canGoBack" tooltip="Back" @click="goBack" />
              <Button variant="tertiary" :icon="chevronRight" icon-only :disabled="!canGoForward" tooltip="Forward" @click="goForward" />
              <UrlInput :model-value="browserDisplayUrl" :pages="browserPages" placeholder="URL" @navigate="navigateToPage" />
            </div>
          </Pane>
          <Pane v-if="previewingRevisionId" fit>
            <div class="revision-banner">
              <Text variant="body-small" color="muted">Viewing past revision</Text>
              <Button variant="tertiary" label="Return to live" @click="exitRevisionPreview" />
            </div>
          </Pane>
          <Pane>
            <iframe
              ref="browserIframeRef"
              :srcdoc="browserHtml"
              class="browser-iframe"
              sandbox="allow-same-origin allow-scripts"
            />
          </Pane>
        </PaneGroup>
      </template>
    </PaneGroup>
  </div>
</template>

<style scoped>
.site-page {
  height: 100%;
}

.is-resizing {
  user-select: none;
  cursor: col-resize;
}

.browser-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-xxs) var(--space-s) var(--space-xxs) var(--space-xxs);
  border-block-end: 1px solid var(--color-frame-border);
}

.revision-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xxs) var(--space-s);
  background: var(--color-frame-fill);
  border-block-end: 1px solid var(--color-frame-border);
}

.browser-iframe {
  flex: 1;
  width: 100%;
  border: none;
}

.chat-pane {
  position: relative;
}

.detail-input {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  padding: var(--space-xl) var(--space-s) var(--space-m);
  z-index: 1;
}

.detail-input--centered {
  position: relative;
  padding: 0 var(--space-s) var(--space-m);
  width: 100%;
  margin: 0 auto;
}

/* -- Progressive blur behind input -- */

.input-blur {
  inset-inline-start: calc(-1 * var(--space-xl));
  inset-inline-end: 16px;
  z-index: -1;
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

.new-task-welcome-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

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
