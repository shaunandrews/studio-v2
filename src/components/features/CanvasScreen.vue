<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { plus, fullscreen } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import Badge from '@/components/primitives/Badge.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import Toolbar from '@/components/composites/Toolbar.vue'
import ScreenSwitcher from '@/components/composites/ScreenSwitcher.vue'
import InputChatMini from '@/components/composites/InputChatMini.vue'
import { useSites } from '@/data/useSites'
import { useUnifiedSidebar } from '@/data/useUnifiedSidebar'
import { useTasks } from '@/data/useTasks'
import { useSiteDocument } from '@/data/useSiteDocument'
import { renderSite } from '@/data/site-renderer'
import { sites as siteRegistry } from '@/data/sites/index'
import { deriveCanvasTree } from '@/data/useSiteTemplates'
import type { CanvasNode } from '@/data/useSiteTemplates'
import { computeCanvasLayout } from '@/data/canvasLayout'
import type { CanvasLayout } from '@/data/canvasLayout'
import SitePageThumb from '@/components/composites/SitePageThumb.vue'
import CanvasCard from '@/components/composites/CanvasCard.vue'
import CanvasThemeView from '@/components/features/CanvasThemeView.vue'
import CanvasSectionView from '@/components/features/CanvasSectionView.vue'
import DotGrid from '@/components/features/onboarding/DotGrid.vue'
import type { MockLayout, TaskContextItem } from '@/data/types'
import { useClampedPosition } from '@/data/useClampedPosition'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const { unifiedSidebar } = useUnifiedSidebar()
const { tasks, sendMessage, generateTaskTitle, createTask } = useTasks()
const { getContent } = useSiteDocument()
const site = computed(() => sites.value.find(s => s.id === props.siteId))
const layout = computed<MockLayout>(() => site.value?.mockLayout ?? 'default')
const siteFiles = computed(() => siteRegistry[layout.value] ?? null)
const siteContent = computed(() => getContent(props.siteId).value)
const tree = computed<CanvasNode | null>(() => {
  if (siteFiles.value) return deriveCanvasTree(siteFiles.value.config)
  return null
})

const canvasLayout = computed<CanvasLayout>(() => {
  if (!tree.value) return { nodes: [], connectors: [], width: 0, height: 0 }
  return computeCanvasLayout(tree.value)
})

/* ── View toggle (Map / Theme) ── */
type CanvasView = 'map' | 'theme'
const activeView = ref<CanvasView>('map')
const viewTabsRef = ref<HTMLElement | null>(null)
const mapTabRef = ref<HTMLElement | null>(null)
const themeTabRef = ref<HTMLElement | null>(null)

const tabIndicatorStyle = computed(() => {
  const tab = activeView.value === 'map' ? mapTabRef.value : themeTabRef.value
  if (!tab || !viewTabsRef.value) return { width: '0px', insetInlineStart: '0px' }
  return {
    width: `${tab.offsetWidth}px`,
    insetInlineStart: `${tab.offsetLeft}px`,
  }
})

/* ── Section zoom view ── */
const sectionViewPage = ref<{ slug: string; title: string } | null>(null)
const screenRef = ref<HTMLElement | null>(null)
const sectionCardRect = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const isTransitioning = ref(false)
const showCanvas = computed(() => !sectionViewPage.value || isTransitioning.value)

function getPageHtml(slug: string): string {
  if (!siteContent.value) return ''
  // Collection slugs with params (e.g. "/blog/:slug") won't match a real page.
  // Fall back to the parent path so the thumbnail shows something useful.
  const resolvedSlug = slug.includes(':') ? slug.replace(/\/:[^/]+$/, '') || '/' : slug
  return renderSite(siteContent.value, resolvedSlug)
}

/* ── Infinite canvas (pan & zoom) ── */

const viewportRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)

/* ── will-change management ── */
const isMoving = ref(false)
let settleTimer: ReturnType<typeof setTimeout> | null = null

function startMoving() {
  isMoving.value = true
  if (settleTimer) clearTimeout(settleTimer)
}

function scheduleSettle() {
  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    isMoving.value = false
  }, 150)
}

const canvasTransform = computed(() =>
  `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`
)

const canvasStyle = computed(() => ({
  transform: canvasTransform.value,
  '--zoom': zoom.value,
} as Record<string, string | number>))

const labelScale = computed(() => `scale(${1 / zoom.value})`)

/* ── Selection ── */

const selectedNodeId = ref<string | null>(null)

function selectNode(id: string) {
  selectedNodeId.value = id
}

function deselectAll() {
  selectedNodeId.value = null
}

/** Walk a CanvasNode tree by ID path (e.g. "0-1-2" → children[0].children[1].children[2]) */
function resolveNodeByPath(root: CanvasNode, id: string): CanvasNode | null {
  if (id === 'root') return root
  const indices = id.split('-').map(Number)
  let node: CanvasNode | undefined = root
  for (const idx of indices) {
    node = node?.children?.[idx]
    if (!node) return null
  }
  return node
}

/** Resolve selected node ID → CanvasNode (or CanvasPart for template parts) */
const selectedNode = computed<CanvasNode | null>(() => {
  if (!selectedNodeId.value || !tree.value) return null
  // Theme view template nodes — resolve via wpTemplates
  if (selectedNodeId.value.startsWith('tpl-')) {
    const idx = parseInt(selectedNodeId.value.slice(4), 10)
    const wpTpls = siteContent.value?.wpTemplates
    if (!wpTpls) return null
    const tpl = wpTpls[idx]
    if (!tpl) return null
    // Use the first rendered page slug, or the template slug as fallback
    const slug = tpl.renders[0] ?? `/${tpl.slug}`
    return { label: tpl.label, slug, template: tpl.slug }
  }
  return resolveNodeByPath(tree.value, selectedNodeId.value)
})

const taskMessage = ref('')
const taskInputRef = ref<InstanceType<typeof InputChatMini> | null>(null)

/** Screen-space position of the task input, anchored below the selected node */
const taskInputPos = ref<{ x: number; y: number } | null>(null)
const taskInputAnchorHeight = ref(0)

const clampedTaskInput = useClampedPosition({
  containerRef: viewportRef,
  rawPos: taskInputPos,
  anchorHeight: taskInputAnchorHeight,
})

function updateTaskInputPos() {
  if (!selectedNodeId.value || !viewportRef.value) {
    taskInputPos.value = null
    return
  }
  const nodeEl = canvasRef.value?.querySelector(`[data-node-id="${selectedNodeId.value}"]`) as HTMLElement | null
  if (!nodeEl) { taskInputPos.value = null; return }

  const vpRect = viewportRef.value.getBoundingClientRect()
  const nodeRect = nodeEl.getBoundingClientRect()

  taskInputAnchorHeight.value = nodeRect.height
  taskInputPos.value = {
    x: nodeRect.left + nodeRect.width / 2 - vpRect.left,
    y: nodeRect.bottom - vpRect.top + 8 * zoom.value,
  }
}

async function sendTask(text: string) {
  if (!text || !selectedNode.value) return

  const node = selectedNode.value!
  const title = `${node.label}: ${text.slice(0, 40)}`
  const context: TaskContextItem[] = [{ type: 'page', pageSlug: node.slug, pageTitle: node.label }]

  const task = await createTask({
    siteId: props.siteId,
    agentId: 'claude-code',
    title,
    context,
  })
  task.unread = true

  sendMessage(task.id, text, context)
  generateTaskTitle(task.id, text)

  taskMessage.value = ''
  selectedNodeId.value = null
}

watch(selectedNodeId, (id) => {
  taskMessage.value = ''
  if (id) {
    nextTick(() => {
      updateTaskInputPos()
      // Delay focus to run after the click event cycle completes —
      // the iframe inside SitePageThumb can steal focus back otherwise.
      setTimeout(() => taskInputRef.value?.focus(), 50)
    })
  } else {
    taskInputPos.value = null
  }
})

// Pan via pointer drag (any button except right-click)
let isPointerDown = false
let isPanning = false
let panStartX = 0
let panStartY = 0
let panOriginX = 0
let panOriginY = 0
let panPointerId = -1
const PAN_THRESHOLD = 4 // px before a click becomes a drag

function onPointerDown(e: PointerEvent) {
  if (e.button === 2) return

  isPointerDown = true
  isPanning = false
  panStartX = e.clientX
  panStartY = e.clientY
  panOriginX = panX.value
  panOriginY = panY.value
  panPointerId = e.pointerId
}

function onPointerMove(e: PointerEvent) {
  if (!isPointerDown) return
  const dx = e.clientX - panStartX
  const dy = e.clientY - panStartY

  if (!isPanning) {
    if (Math.abs(dx) < PAN_THRESHOLD && Math.abs(dy) < PAN_THRESHOLD) return
    isPanning = true
    startMoving()
    viewportRef.value?.setPointerCapture(panPointerId)
  }

  panX.value = panOriginX + dx
  panY.value = panOriginY + dy
  updateTaskInputPos()
}

function onPointerUp(e: PointerEvent) {
  const wasPanning = isPanning
  isPanning = false
  isPointerDown = false

  if (wasPanning) {
    scheduleSettle()
    return
  }

  // It was a click, not a drag — handle selection
  const target = e.target as HTMLElement
  const nodeEl = target.closest('.canvas-node') as HTMLElement | null
  const labelEl = target.closest('.canvas-label') as HTMLElement | null

  if (nodeEl) {
    const id = nodeEl.dataset.nodeId
    if (id != null) selectNode(id)
  } else if (labelEl) {
    // Labels are inside .canvas-node — find the parent node's ID
    const parentNode = labelEl.closest('.canvas-node') as HTMLElement | null
    const id = parentNode?.dataset.nodeId
    if (id != null) selectNode(id)
  } else {
    deselectAll()
  }
}

// Double-click: enter section view for the clicked page node
function onDoubleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const nodeEl = target.closest('.canvas-node') as HTMLElement | null
  if (!nodeEl) return

  // Resolve the node to a page
  const nodeId = nodeEl.dataset.nodeId
  if (!nodeId) return

  // Don't enter section view for part nodes
  if (nodeId.startsWith('part-') || nodeId.startsWith('tpart-')) return

  // Find the corresponding CanvasNode
  let node: CanvasNode | null = null
  if (nodeId.startsWith('tpl-')) {
    // Theme view template — resolve via selectedNode logic
    selectNode(nodeId)
    node = selectedNode.value
  } else if (tree.value) {
    node = resolveNodeByPath(tree.value, nodeId)
  }

  if (node) {
    // Capture card rect for scale-up transition
    if (screenRef.value) {
      const cardContentEl = nodeEl.querySelector('.canvas-card__content') as HTMLElement || nodeEl
      const screenRect = screenRef.value.getBoundingClientRect()
      const cardRect = cardContentEl.getBoundingClientRect()
      sectionCardRect.value = {
        top: cardRect.top - screenRect.top,
        left: cardRect.left - screenRect.left,
        width: cardRect.width,
        height: cardRect.height,
      }
    }
    isTransitioning.value = true
    sectionViewPage.value = { slug: node.slug, title: node.label }
    deselectAll()
  }
}

function exitSectionView() {
  sectionViewPage.value = null
}

/* ── Section view transition hooks ── */

function onSectionEnter(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  const rect = sectionCardRect.value
  const screen = screenRef.value

  if (!rect || !screen) { isTransitioning.value = false; done(); return }

  const sw = screen.offsetWidth
  const sh = screen.offsetHeight
  const scaleX = rect.width / sw
  const scaleY = rect.height / sh

  htmlEl.style.position = 'absolute'
  htmlEl.style.inset = '0'
  htmlEl.style.zIndex = '10'
  htmlEl.style.transformOrigin = '0 0'
  htmlEl.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${scaleX}, ${scaleY})`
  htmlEl.style.borderRadius = 'var(--radius-m)'
  htmlEl.style.overflow = 'hidden'
  htmlEl.style.willChange = 'transform'

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      htmlEl.style.transition = 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 180ms cubic-bezier(0.4, 0, 0.2, 1)'
      htmlEl.style.transform = 'translate(0, 0) scale(1, 1)'
      htmlEl.style.borderRadius = '0'

      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'transform') return
        htmlEl.removeEventListener('transitionend', onEnd)
        htmlEl.style.position = ''
        htmlEl.style.inset = ''
        htmlEl.style.zIndex = ''
        htmlEl.style.transformOrigin = ''
        htmlEl.style.transform = ''
        htmlEl.style.borderRadius = ''
        htmlEl.style.overflow = ''
        htmlEl.style.willChange = ''
        htmlEl.style.transition = ''
        done()
      }
      htmlEl.addEventListener('transitionend', onEnd)
    })
  })
}

function onSectionAfterEnter() {
  isTransitioning.value = false
}

function onSectionLeave(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  const rect = sectionCardRect.value
  const screen = screenRef.value

  if (!rect || !screen) { done(); return }

  // Hide toolbar immediately so it doesn't distort during scale-down
  const toolbarPane = htmlEl.children[0] as HTMLElement
  if (toolbarPane) {
    toolbarPane.style.opacity = '0'
    toolbarPane.style.transition = 'none'
  }

  const sw = screen.offsetWidth
  const sh = screen.offsetHeight
  const scaleX = rect.width / sw
  const scaleY = rect.height / sh

  htmlEl.style.position = 'absolute'
  htmlEl.style.inset = '0'
  htmlEl.style.zIndex = '10'
  htmlEl.style.transformOrigin = '0 0'
  htmlEl.style.overflow = 'hidden'
  htmlEl.style.willChange = 'transform'

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      htmlEl.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 150ms cubic-bezier(0.4, 0, 0.2, 1)'
      htmlEl.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${scaleX}, ${scaleY})`
      htmlEl.style.borderRadius = 'var(--radius-m)'

      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'transform') return
        htmlEl.removeEventListener('transitionend', onEnd)
        done()
      }
      htmlEl.addEventListener('transitionend', onEnd)
    })
  })
}

function onSectionAfterLeave() {
  sectionCardRect.value = null
}

async function onSectionTask(ctx: { sectionId: string; role: string; htmlPreview: string; message: string }) {
  if (!sectionViewPage.value) return

  const shared = siteContent.value?.sections[ctx.sectionId]?.shared ?? false
  const context: TaskContextItem[] = [{
    type: 'section',
    pageSlug: sectionViewPage.value.slug,
    pageTitle: sectionViewPage.value.title,
    sectionId: ctx.sectionId,
    sectionRole: ctx.role || undefined,
    shared: shared || undefined,
  }]

  const task = await createTask({
    siteId: props.siteId,
    agentId: 'claude-code',
    title: `${ctx.sectionId}: ${ctx.message.slice(0, 40)}`,
    context,
  })
  task.unread = true

  sendMessage(task.id, ctx.message, context)
  generateTaskTitle(task.id, ctx.message)
}

// Smooth animated zoom transition
let animFrame: number | null = null

function animateZoomTo(targetX: number, targetY: number, targetZoom: number) {
  if (animFrame) cancelAnimationFrame(animFrame)
  startMoving()

  const startX = panX.value
  const startY = panY.value
  const startZoom = zoom.value
  const duration = 300
  const startTime = performance.now()

  function step(now: number) {
    const t = Math.min(1, (now - startTime) / duration)
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3)

    panX.value = startX + (targetX - startX) * ease
    panY.value = startY + (targetY - startY) * ease
    zoom.value = startZoom + (targetZoom - startZoom) * ease

    if (t < 1) {
      animFrame = requestAnimationFrame(step)
    } else {
      animFrame = null
      scheduleSettle()
      updateTaskInputPos()
    }
  }

  animFrame = requestAnimationFrame(step)
}

const MIN_ZOOM = 0.15
const MAX_ZOOM = 6
const MAX_ZOOM_STEP = 10
const ZOOM_SENSITIVITY = 0.01

function notifyCanvasMoved() {
  startMoving()
  scheduleSettle()
  updateTaskInputPos()
}

function applyZoomAtPoint(px: number, py: number, targetZoom: number) {
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom))
  if (newZoom === zoom.value) return
  const scale = newZoom / zoom.value
  panX.value = px - scale * (px - panX.value)
  panY.value = py - scale * (py - panY.value)
  zoom.value = newZoom
  notifyCanvasMoved()
}

function onWheel(e: WheelEvent) {
  e.preventDefault()

  const viewport = viewportRef.value
  if (!viewport) return
  const rect = viewport.getBoundingClientRect()
  const pointerX = e.clientX - rect.left
  const pointerY = e.clientY - rect.top

  if (e.ctrlKey || e.metaKey) {
    const clamped = Math.max(-MAX_ZOOM_STEP, Math.min(MAX_ZOOM_STEP, e.deltaY))
    applyZoomAtPoint(pointerX, pointerY, zoom.value * (1 - clamped * ZOOM_SENSITIVITY))
  } else {
    if (e.deltaX === 0 && e.deltaY === 0) return
    panX.value -= e.deltaX
    panY.value -= e.deltaY
    notifyCanvasMoved()
  }
}

// Safari fires GestureEvent for trackpad pinch instead of ctrlKey wheel events
let gestureStartZoom = 1

function onGestureStart(e: Event) {
  e.preventDefault()
  gestureStartZoom = zoom.value
}

function onGestureChange(e: Event) {
  e.preventDefault()
  const ge = e as { clientX: number; clientY: number; scale: number } & Event
  const viewport = viewportRef.value
  if (!viewport) return
  const rect = viewport.getBoundingClientRect()
  applyZoomAtPoint(ge.clientX - rect.left, ge.clientY - rect.top, gestureStartZoom * ge.scale)
}

// Center the tree on mount
function centerCanvas() {
  const viewport = viewportRef.value
  if (!viewport) return

  // For map view, use computed layout bounds; for theme view, measure content child
  let cw: number
  let ch: number

  if (activeView.value === 'map') {
    cw = canvasLayout.value.width
    ch = canvasLayout.value.height
  } else {
    // Theme view: measure the first child element (CanvasThemeView root)
    const canvas = canvasRef.value
    if (!canvas) return
    const content = canvas.firstElementChild as HTMLElement | null
    if (!content) return
    const prevTransform = canvas.style.transform
    canvas.style.transform = 'none'
    cw = content.offsetWidth
    ch = content.offsetHeight
    canvas.style.transform = prevTransform
  }

  if (!cw || !ch) return

  const vw = viewport.clientWidth
  const vh = viewport.clientHeight
  if (!vw || !vh) return

  // Fit tree within viewport with some padding
  const padded = 80
  const scaleX = (vw - padded * 2) / cw
  const scaleY = (vh - padded * 2) / ch
  zoom.value = Math.min(1, Math.max(0.2, Math.min(scaleX, scaleY)))

  panX.value = (vw - cw * zoom.value) / 2
  panY.value = (vh - ch * zoom.value) / 2
}

// Effective page scale: iframe renders at 800px scaled 0.2× into 160px thumb,
// so real page scale = 0.2 × canvasZoom. Display 100% when pages are 1:1.
const THUMB_SCALE = 0.2
const zoomPercent = computed(() => Math.round(THUMB_SCALE * zoom.value * 100))

function zoomBy(delta: number) {
  const viewport = viewportRef.value
  if (!viewport) return
  const rect = viewport.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value + delta))
  if (newZoom === zoom.value) return
  const scale = newZoom / zoom.value
  panX.value = cx - scale * (cx - panX.value)
  panY.value = cy - scale * (cy - panY.value)
  zoom.value = newZoom
  notifyCanvasMoved()
}

function zoomIn() { zoomBy(zoom.value * 0.2) }
function zoomOut() { zoomBy(zoom.value * -0.2) }
function zoomFit() {
  centerCanvas()
  notifyCanvasMoved()
}


let ro: ResizeObserver | null = null
let prevViewport: HTMLElement | null = null
let lastVisibleSize = { width: 0, height: 0 }

function attachViewport(el: HTMLElement) {
  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('gesturestart', onGestureStart, { passive: false } as any)
  el.addEventListener('gesturechange', onGestureChange, { passive: false } as any)
  ro = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect
    if (width === 0 && height === 0) return // hidden via v-show
    if (width === lastVisibleSize.width && height === lastVisibleSize.height) return
    lastVisibleSize = { width, height }
    centerCanvas()
  })
  ro.observe(el)
  prevViewport = el
}

function detachViewport() {
  if (prevViewport) {
    prevViewport.removeEventListener('wheel', onWheel)
    prevViewport.removeEventListener('gesturestart', onGestureStart)
    prevViewport.removeEventListener('gesturechange', onGestureChange)
    prevViewport = null
  }
  ro?.disconnect()
  ro = null
}

// Re-attach listeners when viewportRef is recreated (e.g. after exiting section view)
watch(viewportRef, (el, oldEl) => {
  if (oldEl && oldEl !== el) detachViewport()
  if (el) {
    attachViewport(el)
    nextTick(() => centerCanvas())
  }
})

function onKeydown(e: KeyboardEvent) {
  if (!(e.metaKey || e.ctrlKey)) return
  if (e.key === '=' || e.key === '+') {
    e.preventDefault()
    zoomIn()
  } else if (e.key === '-') {
    e.preventDefault()
    zoomOut()
  } else if (e.key === '0') {
    e.preventDefault()
    zoomFit()
  }
}

onMounted(() => {
  nextTick(() => centerCanvas())
  if (viewportRef.value) {
    attachViewport(viewportRef.value)
  }
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  detachViewport()
  document.removeEventListener('keydown', onKeydown)
  if (settleTimer) clearTimeout(settleTimer)
  if (animFrame) cancelAnimationFrame(animFrame)
})

watch(tree, () => nextTick(() => centerCanvas()))
</script>

<template>
  <div class="canvas-screen" ref="screenRef">
  <!-- Canvas view (map or theme) -->
  <div v-show="showCanvas" class="canvas-layer">
  <Toolbar :title="unifiedSidebar ? undefined : 'Canvas'" size="mini">
    <template v-if="unifiedSidebar" #start>
      <ScreenSwitcher title="Canvas" />
    </template>
    <template #center>
      <nav ref="viewTabsRef" class="view-tabs">
        <button ref="mapTabRef" class="view-tab" :class="{ 'is-active': activeView === 'map' }" @click="activeView = 'map'; deselectAll(); nextTick(() => centerCanvas())">Map</button>
        <button ref="themeTabRef" class="view-tab" :class="{ 'is-active': activeView === 'theme' }" @click="activeView = 'theme'; deselectAll(); nextTick(() => centerCanvas())">Theme</button>
        <span class="view-tabs__indicator" aria-hidden="true" :style="tabIndicatorStyle" />
      </nav>
    </template>
    <template #end>
      <div class="zoom-controls hstack align-center gap-xs">
        <Button variant="tertiary" icon-only tooltip="Zoom out" tooltip-placement="bottom" @click="zoomOut">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor" /></svg>
        </Button>
        <span class="zoom-level">{{ zoomPercent }}%</span>
        <Button variant="tertiary" :icon="plus" icon-only tooltip="Zoom in" tooltip-placement="bottom" @click="zoomIn" />
        <Button variant="tertiary" :icon="fullscreen" icon-only tooltip="Fit to screen" tooltip-placement="bottom" @click="zoomFit" />
      </div>
    </template>
  </Toolbar>
  <div
    ref="viewportRef"
    class="canvas-viewport"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @dblclick="onDoubleClick"
  >
    <DotGrid :opacity="0.06" :repulsion="0.5" :ripple-strength="0.75" :spacing="14" :cross-size="4" :cross-thickness=".5" />
    <div ref="canvasRef" class="canvas-canvas" :class="{ 'is-moving': isMoving }" :style="canvasStyle">
      <!-- Connectors (SVG inside transform group — real-time zoom/pan for free) -->
      <svg v-if="activeView === 'map' && canvasLayout.connectors.length" class="canvas-connectors" aria-hidden="true">
        <path v-for="c in canvasLayout.connectors" :key="c.id" :d="c.path" :data-source="c.sourceId" :data-target="c.targetId" />
      </svg>

      <!-- Map view — flat node list, absolutely positioned -->
      <template v-if="activeView === 'map'">
        <div
          v-for="node in canvasLayout.nodes" :key="node.id"
          class="canvas-node"
          :data-node-id="node.id"
          :style="{ transform: `translate(${node.x}px, ${node.y}px)` }"
        >
          <span class="canvas-label" :class="{ 'is-selected': selectedNodeId === node.id }" :style="{ transform: labelScale }">{{ node.label }}</span>
          <CanvasCard :selected="selectedNodeId === node.id" :stack="node.isCollection" :count="node.collectionCount">
            <SitePageThumb v-if="siteContent" :html="getPageHtml(node.slug)" />
          </CanvasCard>
        </div>
      </template>

      <!-- Theme view -->
      <CanvasThemeView
        v-if="activeView === 'theme'"
        :site-id="props.siteId"
        :mock-layout="layout"
        :selected-node-id="selectedNodeId"
        :label-scale="labelScale"
        @select="selectNode"
      />
    </div>

    <!-- Floating task input anchored to selected node -->
    <Transition name="task-input">
      <div v-if="selectedNode && clampedTaskInput" class="task-input-float" :style="{ left: clampedTaskInput.left + 'px', top: clampedTaskInput.top + 'px' }" @click.stop>
        <div class="task-input-context">
          <Badge :label="selectedNode.label" />
        </div>
        <InputChatMini
          ref="taskInputRef"
          v-model="taskMessage"
          placeholder="Start a new task..."
          elevated
          @send="sendTask"
        />
      </div>
    </Transition>

  </div>
  </div>

  <!-- Section zoom view (animates from card) -->
  <Transition :css="false" @enter="onSectionEnter" @after-enter="onSectionAfterEnter" @leave="onSectionLeave" @after-leave="onSectionAfterLeave">
    <CanvasSectionView
      v-if="sectionViewPage"
      :site-id="props.siteId"
      :page-slug="sectionViewPage.slug"
      :page-title="sectionViewPage.title"
      :animating="isTransitioning"
      @back="exitSectionView"
      @create-task="onSectionTask"
    />
  </Transition>
  </div>
</template>

<style scoped>
/* ── Screen wrapper ── */

.canvas-screen {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.canvas-layer {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* ── Infinite canvas viewport ── */

.canvas-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  background-color: var(--color-frame-fill);
}

.canvas-viewport:active {
  cursor: grabbing;
}

/* ── View tabs ── */

.view-tabs {
  position: relative;
  display: flex;
  height: 100%;
}

.view-tab {
  position: relative;
  padding: 0 var(--space-s);
  height: 100%;
  border: none;
  background: none;
  color: var(--color-frame-fg-muted);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  font-family: inherit;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-default);
}

.view-tab:hover {
  color: var(--color-frame-fg);
}

.view-tab.is-active {
  color: var(--color-frame-fg);
}

.view-tabs__indicator {
  position: absolute;
  inset-block-end: 0;
  height: 2px;
  background: var(--color-frame-fg);
  border-radius: 1px;
  transition: inset-inline-start var(--duration-moderate) var(--ease-out),
    width var(--duration-moderate) var(--ease-out);
}

/* ── Zoom controls ── */

.zoom-level {
  min-width: 36px;
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  font-variant-numeric: tabular-nums;
}

.canvas-canvas {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  transform-origin: 0 0;
}

.canvas-canvas.is-moving {
  will-change: transform;
}

/* ── SVG connectors ── */

.canvas-connectors {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.canvas-connectors path {
  fill: none;
  stroke: var(--color-frame-border-solid);
  stroke-width: calc(3px / var(--zoom, 1));
  stroke-linecap: round;
}

/* ── Node ── */

.canvas-node {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  cursor: pointer;
}

.canvas-label {
  position: absolute;
  inset-block-end: 100%;
  inset-inline-start: 0;
  margin-block-end: calc(4px / var(--zoom, 1));
  transform-origin: bottom left; /* physical: anchored to thumbnail corner */
  z-index: 2;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
  line-height: 1;
}

.canvas-label.is-selected {
  color: var(--color-frame-selected);
}



/* ── Floating task input ── */

.task-input-float {
  position: absolute;
  z-index: 10;
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.task-input-context {
  display: flex;
  gap: var(--space-xxxs);
}

/* ── Task input transition ── */

.task-input-enter-active,
.task-input-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default);
}

.task-input-enter-from,
.task-input-leave-to {
  opacity: 0;
  transform: translateY(calc(-1 * var(--space-xs)));
}

/* ── Dark mode ── */

</style>
