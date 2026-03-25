<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { plus, fullscreen } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import InputChatMini from '@/components/composites/InputChatMini.vue'
import { useSites } from '@/data/useSites'
import { useTasks } from '@/data/useTasks'
import { useSiteDocument } from '@/data/useSiteDocument'
import { renderSite, renderSection } from '@/data/site-renderer'
import { sites as siteRegistry } from '@/data/sites/index'
import { deriveSiteMapTree, deriveSiteMapParts } from '@/data/useSiteTemplates'
import type { SiteMapNode, SiteMapPart } from '@/data/useSiteTemplates'
import SitePageThumb from '@/components/composites/SitePageThumb.vue'
import SiteSectionThumb from '@/components/composites/SiteSectionThumb.vue'
import SiteMapThemeView from '@/components/features/SiteMapThemeView.vue'
import SiteMapSectionView from '@/components/features/SiteMapSectionView.vue'
import type { MockLayout } from '@/data/types'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const { tasks, sendMessage, generateTaskTitle, createTask } = useTasks()
const { getContent } = useSiteDocument()
const site = computed(() => sites.value.find(s => s.id === props.siteId))
const layout = computed<MockLayout>(() => site.value?.mockLayout ?? 'default')
const siteFiles = computed(() => siteRegistry[layout.value] ?? null)
const siteContent = computed(() => getContent(props.siteId).value)
const tree = computed<SiteMapNode | null>(() => {
  if (siteFiles.value) return deriveSiteMapTree(siteFiles.value.config)
  return null
})

const parts = computed<SiteMapPart[]>(() => {
  if (siteFiles.value) return deriveSiteMapParts(siteFiles.value.config)
  return []
})

/* ── View toggle (Map / Theme) ── */
type SiteMapView = 'map' | 'theme'
const activeView = ref<SiteMapView>('map')

/* ── Section zoom view ── */
const sectionViewPage = ref<{ slug: string; title: string } | null>(null)

function getPageHtml(slug: string): string {
  if (!siteContent.value) return ''
  // Collection slugs with params (e.g. "/blog/:slug") won't match a real page.
  // Fall back to the parent path so the thumbnail shows something useful.
  const resolvedSlug = slug.includes(':') ? slug.replace(/\/:[^/]+$/, '') || '/' : slug
  return renderSite(siteContent.value, resolvedSlug)
}

function getSectionHtml(sectionId: string): string {
  if (!siteContent.value) return ''
  return renderSection(siteContent.value, sectionId)
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
    computeConnectors()
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
const badgeTransform = computed(() => `translate(40%, -40%) scale(${1 / zoom.value})`)

/* ── Selection ── */

const selectedNodeId = ref<string | null>(null)

function selectNode(id: string) {
  selectedNodeId.value = id
}

function deselectAll() {
  selectedNodeId.value = null
}

/** Resolve selected node ID → SiteMapNode (or SiteMapPart for template parts) */
const selectedNode = computed<SiteMapNode | null>(() => {
  if (!selectedNodeId.value || !tree.value) return null
  // Part-type IDs handled by selectedPart
  if (selectedNodeId.value.startsWith('part-') || selectedNodeId.value.startsWith('tpart-')) return null
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
  if (selectedNodeId.value === 'root') return tree.value
  const indices = selectedNodeId.value.split('-').map(Number)
  const l1 = tree.value.children?.[indices[0]]
  if (!l1) return null
  if (indices.length === 1) return l1
  return l1.children?.[indices[1]] ?? null
})

const selectedPart = computed<SiteMapPart | null>(() => {
  if (!selectedNodeId.value) return null
  if (selectedNodeId.value.startsWith('part-')) {
    const partIndex = parseInt(selectedNodeId.value.slice(5), 10)
    return parts.value[partIndex] ?? null
  }
  if (selectedNodeId.value.startsWith('tpart-')) {
    const partIndex = parseInt(selectedNodeId.value.slice(6), 10)
    return parts.value[partIndex] ?? null
  }
  return null
})

const taskMessage = ref('')
const taskInputRef = ref<InstanceType<typeof InputChatMini> | null>(null)

/** Screen-space position of the task input, anchored below the selected node */
const taskInputPos = ref<{ x: number; y: number } | null>(null)

function updateTaskInputPos() {
  if (!selectedNodeId.value || !viewportRef.value) {
    taskInputPos.value = null
    return
  }
  const nodeEl = canvasRef.value?.querySelector(`[data-node-id="${selectedNodeId.value}"]`) as HTMLElement | null
  if (!nodeEl) { taskInputPos.value = null; return }

  const vpRect = viewportRef.value.getBoundingClientRect()
  const nodeRect = nodeEl.getBoundingClientRect()

  taskInputPos.value = {
    x: nodeRect.left + nodeRect.width / 2 - vpRect.left,
    y: nodeRect.bottom - vpRect.top + 8 * zoom.value,
  }
}

async function sendTask(text: string) {
  if (!text || (!selectedNode.value && !selectedPart.value)) return

  let title: string
  let contextMessage: string

  if (selectedPart.value) {
    // Template part context
    const part = selectedPart.value
    title = `${part.label}: ${text.slice(0, 40)}`
    contextMessage = `[Context: Shared template part "${part.id}" (appears on all pages)]\nRole: ${part.label.toLowerCase()}\n\n${text}`
  } else {
    // Page context
    const node = selectedNode.value!
    const page = siteContent.value?.pages.find(p => p.slug === node.slug || (node.slug === '/' && p.slug === '/'))
    const sectionList = page?.sections
      .map(id => {
        const s = siteContent.value?.sections[id]
        return s ? `${id}${s.role ? ` [${s.role}]` : ''}` : id
      })
      .join(', ') ?? ''

    title = `${node.label}: ${text.slice(0, 40)}`
    contextMessage = `[Context: Page "${node.label}" (${node.slug})]\nSections on this page: ${sectionList}\n\n${text}`
  }

  const task = await createTask({
    siteId: props.siteId,
    agentId: 'claude-code',
    title,
  })
  task.unread = true

  sendMessage(task.id, contextMessage)
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
  const target = e.target as HTMLElement
  if (target.closest('.sitemap-toolbar')) return

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
  const nodeEl = target.closest('.sitemap-node') as HTMLElement | null
  const labelEl = target.closest('.sitemap-label') as HTMLElement | null

  if (nodeEl) {
    const id = nodeEl.dataset.nodeId
    if (id != null) selectNode(id)
  } else if (labelEl) {
    // Labels have the same click logic — find the sibling node's ID
    const branch = labelEl.closest('.sitemap-branch') ?? labelEl.parentElement
    const siblingNode = branch?.querySelector('.sitemap-node') as HTMLElement | null
    const id = siblingNode?.dataset.nodeId
    if (id != null) selectNode(id)
  } else {
    deselectAll()
  }
}

// Double-click: enter section view for the clicked page node
function onDoubleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const nodeEl = target.closest('.sitemap-node') as HTMLElement | null
  if (!nodeEl) return

  // Resolve the node to a page
  const nodeId = nodeEl.dataset.nodeId
  if (!nodeId) return

  // Don't enter section view for part nodes
  if (nodeId.startsWith('part-') || nodeId.startsWith('tpart-')) return

  // Find the corresponding SiteMapNode
  let node: SiteMapNode | null = null
  if (nodeId === 'root') {
    node = tree.value
  } else if (nodeId.startsWith('tpl-')) {
    // Theme view template — resolve via selectedNode logic
    selectNode(nodeId)
    node = selectedNode.value
  } else {
    const indices = nodeId.split('-').map(Number)
    const l1 = tree.value?.children?.[indices[0]]
    if (l1 && indices.length === 1) node = l1
    else if (l1) node = l1.children?.[indices[1]] ?? null
  }

  if (node) {
    sectionViewPage.value = { slug: node.slug, title: node.label }
    deselectAll()
  }
}

function exitSectionView() {
  sectionViewPage.value = null
}

async function onSectionTask(ctx: { sectionId: string; role: string; htmlPreview: string; message: string }) {
  if (!sectionViewPage.value) return

  const task = await createTask({
    siteId: props.siteId,
    agentId: 'claude-code',
    title: `${ctx.sectionId}: ${ctx.message.slice(0, 40)}`,
  })
  task.unread = true

  const contextMessage = `[Context: Section "${ctx.sectionId}" on page "${sectionViewPage.value.title}" (${sectionViewPage.value.slug})]\nRole: ${ctx.role || 'content'}\nCurrent content preview: ${ctx.htmlPreview.slice(0, 200)}\n\n${ctx.message}`
  sendMessage(task.id, contextMessage)
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

// Zoom via wheel (Ctrl+wheel = zoom, plain wheel = pan)
function onWheel(e: WheelEvent) {
  e.preventDefault()

  if (e.ctrlKey || e.metaKey) {
    // Pinch-to-zoom or Ctrl+wheel → zoom
    const viewport = viewportRef.value!
    const rect = viewport.getBoundingClientRect()
    const pointerX = e.clientX - rect.left
    const pointerY = e.clientY - rect.top

    const delta = -e.deltaY * 0.005
    const newZoom = Math.min(6, Math.max(0.15, zoom.value * (1 + delta)))
    const scale = newZoom / zoom.value

    // Zoom toward pointer position
    panX.value = pointerX - scale * (pointerX - panX.value)
    panY.value = pointerY - scale * (pointerY - panY.value)
    zoom.value = newZoom
  } else {
    // Plain scroll → pan
    panX.value -= e.deltaX
    panY.value -= e.deltaY
  }
  startMoving()
  scheduleSettle()
  updateTaskInputPos()
}

// Center the tree on mount
function centerCanvas() {
  const viewport = viewportRef.value
  const canvas = canvasRef.value
  if (!viewport || !canvas) return

  // Temporarily reset transform so we can measure natural content size
  const prevTransform = canvas.style.transform
  canvas.style.transform = 'none'

  const root = canvas.querySelector('.sitemap-canvas-content') as HTMLElement | null
  if (!root) { canvas.style.transform = prevTransform; return }

  const cw = root.offsetWidth
  const ch = root.offsetHeight

  canvas.style.transform = prevTransform

  const vw = viewport.clientWidth
  const vh = viewport.clientHeight

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
  const newZoom = Math.min(6, Math.max(0.15, zoom.value + delta))
  const scale = newZoom / zoom.value
  panX.value = cx - scale * (cx - panX.value)
  panY.value = cy - scale * (cy - panY.value)
  zoom.value = newZoom
  startMoving()
  scheduleSettle()
  updateTaskInputPos()
}

function zoomIn() { zoomBy(zoom.value * 0.2) }
function zoomOut() { zoomBy(zoom.value * -0.2) }
function zoomFit() {
  centerCanvas()
  startMoving()
  scheduleSettle()
  updateTaskInputPos()
}

/* ── SVG connector system (tree routing — no overlap) ── */

const connectorPath = ref('')

const CORNER_RADIUS = 8
const RAIL_GAP = 28 // vertical gap between parent bottom / child top and the horizontal rail

/**
 * Build a tree connector from one parent to N children.
 * Draws: vertical trunk → horizontal rail → vertical drops.
 * All corners are rounded. No overlapping segments.
 */
function buildTreePaths(
  parentX: number, parentY: number,
  childrenCoords: { x: number; y: number }[],
): string[] {
  if (childrenCoords.length === 0) return []

  const paths: string[] = []
  const r = CORNER_RADIUS

  // Rail Y sits halfway between parent bottom and the top of the nearest child
  const nearestChildY = Math.min(...childrenCoords.map(c => c.y))
  const railY = parentY + (nearestChildY - parentY) / 2

  // Single child — just a straight vertical line
  if (childrenCoords.length === 1) {
    const c = childrenCoords[0]
    if (Math.abs(c.x - parentX) < 1) {
      paths.push(`M ${parentX} ${parentY} L ${c.x} ${c.y}`)
    } else {
      const dir = c.x > parentX ? 1 : -1
      const cr = Math.min(r, Math.abs(c.x - parentX) / 2, railY - parentY, c.y - railY)
      paths.push([
        `M ${parentX} ${parentY}`,
        `L ${parentX} ${railY - cr}`,
        `Q ${parentX} ${railY} ${parentX + cr * dir} ${railY}`,
        `L ${c.x - cr * dir} ${railY}`,
        `Q ${c.x} ${railY} ${c.x} ${railY + cr}`,
        `L ${c.x} ${c.y}`,
      ].join(' '))
    }
    return paths
  }

  // Multiple children: trunk + rail + drops
  const sorted = [...childrenCoords].sort((a, b) => a.x - b.x)
  const leftX = sorted[0].x
  const rightX = sorted[sorted.length - 1].x

  // Trunk: parent center down to rail
  paths.push(`M ${parentX} ${parentY} L ${parentX} ${railY}`)

  // Horizontal rail: from leftmost child to rightmost child
  // with rounded corners at the trunk junction
  // We draw rail as: left end → right end (the trunk connects into it)
  paths.push(`M ${leftX} ${railY} L ${rightX} ${railY}`)

  // Drops: from rail down to each child, with rounded corner at rail junction
  for (const c of childrenCoords) {
    const dropPath = `M ${c.x} ${railY} L ${c.x} ${c.y}`
    paths.push(dropPath)
  }

  // Now replace the sharp corners with rounded ones.
  // We need rounded corners where:
  // 1. The trunk meets the rail (T-junction) — already smooth since they overlap at the center
  // 2. The rail ends turn down to the leftmost/rightmost children
  // 3. Inner drops are straight vertical from rail

  // Actually, let's redraw properly with rounded corners at the rail ends.
  paths.length = 0

  // Trunk: parent down to rail (stopping short of rail for the center drop)
  paths.push(`M ${parentX} ${parentY} L ${parentX} ${railY}`)

  // For each child, draw from rail to child with rounded corner where rail turns to drop
  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i]
    const cr = Math.min(r, c.y - railY)

    if (Math.abs(c.x - parentX) < 1) {
      // Center child — straight drop from trunk through rail
      paths.push(`M ${c.x} ${railY} L ${c.x} ${c.y}`)
    } else if (c.x < parentX) {
      // Left of parent
      const arcR = Math.min(cr, parentX - c.x)
      paths.push([
        `M ${parentX} ${railY}`,
        `L ${c.x + arcR} ${railY}`,
        `Q ${c.x} ${railY} ${c.x} ${railY + arcR}`,
        `L ${c.x} ${c.y}`,
      ].join(' '))
    } else {
      // Right of parent
      const arcR = Math.min(cr, c.x - parentX)
      paths.push([
        `M ${parentX} ${railY}`,
        `L ${c.x - arcR} ${railY}`,
        `Q ${c.x} ${railY} ${c.x} ${railY + arcR}`,
        `L ${c.x} ${c.y}`,
      ].join(' '))
    }
  }

  return paths
}

function computeConnectors() {
  const canvas = canvasRef.value
  if (!canvas) return

  const origin = canvas.getBoundingClientRect()
  const s = zoom.value // account for scale
  const paths: string[] = []

  function getNodeRect(id: string) {
    const el = canvas!.querySelector(`[data-node-id="${id}"] .page-thumb`) as HTMLElement | null
    if (!el) return null
    const r = el.getBoundingClientRect()
    // Convert screen coords back to canvas-local coords
    return {
      cx: (r.left + r.width / 2 - origin.left) / s,
      top: (r.top - origin.top) / s,
      bottom: (r.bottom - origin.top) / s,
    }
  }

  const root = getNodeRect('root')
  if (!root) return

  const children = tree.value?.children ?? []
  const childCoords: { x: number; y: number }[] = []

  for (let i = 0; i < children.length; i++) {
    const c = getNodeRect(`${i}`)
    if (c) childCoords.push({ x: c.cx, y: c.top })
  }

  paths.push(...buildTreePaths(root.cx, root.bottom, childCoords))

  // Level 2: each L1 parent → its L2 children
  for (let i = 0; i < children.length; i++) {
    const grandchildren = children[i].children ?? []
    if (grandchildren.length === 0) continue

    const parent = getNodeRect(`${i}`)
    if (!parent) continue

    const gcCoords: { x: number; y: number }[] = []
    for (let j = 0; j < grandchildren.length; j++) {
      const gc = getNodeRect(`${i}-${j}`)
      if (gc) gcCoords.push({ x: gc.cx, y: gc.top })
    }

    paths.push(...buildTreePaths(parent.cx, parent.bottom, gcCoords))
  }

  connectorPath.value = paths.join(' ')
}

let updateRequested = false
function requestConnectorUpdate() {
  if (updateRequested) return
  updateRequested = true
  requestAnimationFrame(() => {
    updateRequested = false
    computeConnectors()
  })
}

let ro: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    centerCanvas()
    nextTick(() => computeConnectors())
  })
  if (viewportRef.value) {
    viewportRef.value.addEventListener('wheel', onWheel, { passive: false })
    ro = new ResizeObserver(() => {
      centerCanvas()
      requestConnectorUpdate()
    })
    ro.observe(viewportRef.value)
  }
})

onUnmounted(() => {
  ro?.disconnect()
  viewportRef.value?.removeEventListener('wheel', onWheel)
  if (settleTimer) clearTimeout(settleTimer)
  if (animFrame) cancelAnimationFrame(animFrame)
})

watch(tree, () => nextTick(() => {
  centerCanvas()
  nextTick(() => computeConnectors())
}))
</script>

<template>
  <!-- Section zoom view (full-pane, replaces canvas) -->
  <SiteMapSectionView
    v-if="sectionViewPage"
    :site-id="props.siteId"
    :page-slug="sectionViewPage.slug"
    :page-title="sectionViewPage.title"
    @back="exitSectionView"
    @create-task="onSectionTask"
  />

  <!-- Canvas view (map or theme) -->
  <div
    v-else
    ref="viewportRef"
    class="sitemap-viewport"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @dblclick="onDoubleClick"
  >
    <div ref="canvasRef" class="sitemap-canvas" :class="{ 'is-moving': isMoving }" :style="canvasStyle">
      <!-- SVG connector layer (map view only) -->
      <svg v-if="activeView === 'map'" class="sitemap-connectors" aria-hidden="true">
        <path :d="connectorPath" />
      </svg>

      <!-- Map view -->
      <div v-if="activeView === 'map' && tree" class="sitemap-canvas-content">
        <!-- Page hierarchy tree -->
        <div class="sitemap-root">
          <div class="sitemap-node" :class="{ 'is-selected': selectedNodeId === 'root' }" data-node-id="root">
            <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === 'root' }" :style="{ transform: labelScale }">{{ tree.label }}</span>
            <div class="page-thumb">
              <SitePageThumb v-if="siteContent" :html="getPageHtml(tree.slug)" />
            </div>
          </div>

          <!-- Level 1 -->
          <div v-if="tree.children?.length" class="sitemap-level">
            <div class="sitemap-level__nodes">
              <div v-for="(child, ci) in tree.children" :key="child.label" class="sitemap-branch">
                <div class="sitemap-node" :data-node-id="String(ci)" :class="{ 'sitemap-node--stack': child.isCollection, 'is-selected': selectedNodeId === String(ci) }">
                  <div v-if="child.isCollection" class="stack-cards">
                    <div class="stack-card" />
                    <div class="stack-card" />
                  </div>
                  <div class="page-thumb">
                    <SitePageThumb v-if="siteContent" :html="getPageHtml(child.slug)" />
                  </div>
                  <span v-if="child.isCollection" class="sitemap-badge" :style="{ transform: badgeTransform }">{{ child.collectionCount }}</span>
                  <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === String(ci) }" :style="{ transform: labelScale }">{{ child.label }}</span>
                </div>

                <!-- Level 2 children -->
                <template v-if="child.children?.length">
                  <div class="sitemap-level sitemap-level--sub">
                    <div class="sitemap-level__nodes">
                      <div v-for="(gc, gci) in child.children" :key="gc.label" class="sitemap-branch">
                        <div class="sitemap-node" :data-node-id="`${ci}-${gci}`" :class="{ 'sitemap-node--stack': gc.isCollection, 'is-selected': selectedNodeId === `${ci}-${gci}` }">
                          <div v-if="gc.isCollection" class="stack-cards">
                            <div class="stack-card" />
                            <div class="stack-card" />
                          </div>
                          <div class="page-thumb">
                            <SitePageThumb v-if="siteContent" :html="getPageHtml(gc.slug)" />
                          </div>
                          <span v-if="gc.isCollection" class="sitemap-badge" :style="{ transform: badgeTransform }">{{ gc.collectionCount }}</span>
                          <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === `${ci}-${gci}` }" :style="{ transform: labelScale }">{{ gc.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Template Parts floating group -->
        <div v-if="parts.length" class="sitemap-parts-group">
          <span class="sitemap-group-label" :style="{ transform: labelScale }">Template Parts</span>
          <div class="sitemap-parts-nodes">
            <div v-for="(part, pi) in parts" :key="part.id" class="sitemap-node" :data-node-id="`part-${pi}`" :class="{ 'is-selected': selectedNodeId === `part-${pi}` }">
              <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === `part-${pi}` }" :style="{ transform: labelScale }">{{ part.label }}</span>
              <SiteSectionThumb v-if="siteContent" :html="getSectionHtml(part.id)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Theme view -->
      <SiteMapThemeView
        v-if="activeView === 'theme'"
        :site-id="props.siteId"
        :mock-layout="layout"
        :selected-node-id="selectedNodeId"
        :label-scale="labelScale"
        :badge-transform="badgeTransform"
        @select="selectNode"
      />
    </div>

    <!-- Floating task input anchored to selected node -->
    <Transition name="task-input">
      <div v-if="(selectedNode || selectedPart) && taskInputPos" class="task-input-float" :style="{ left: taskInputPos.x + 'px', top: taskInputPos.y + 'px' }" @click.stop>
        <InputChatMini
          ref="taskInputRef"
          v-model="taskMessage"
          placeholder="Start a new task..."
          elevated
          @send="sendTask"
        />
      </div>
    </Transition>

    <!-- View toggle -->
    <div class="view-toggle">
      <button class="view-toggle-btn" :class="{ 'is-active': activeView === 'map' }" @click="activeView = 'map'; deselectAll(); nextTick(() => { centerCanvas(); nextTick(() => computeConnectors()) })">Map</button>
      <button class="view-toggle-btn" :class="{ 'is-active': activeView === 'theme' }" @click="activeView = 'theme'; deselectAll(); nextTick(() => centerCanvas())">Theme</button>
    </div>

    <!-- Floating toolbar -->
    <div class="sitemap-toolbar">
      <Tooltip text="Zoom out" placement="top" :delay="300">
        <button class="toolbar-btn" @click="zoomOut">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor" /></svg>
        </button>
      </Tooltip>
      <span class="toolbar-zoom">{{ zoomPercent }}%</span>
      <Tooltip text="Zoom in" placement="top" :delay="300">
        <button class="toolbar-btn" @click="zoomIn">
          <WPIcon :icon="plus" :size="18" />
        </button>
      </Tooltip>
      <div class="toolbar-divider" />
      <Tooltip text="Fit to screen" placement="top" :delay="300">
        <button class="toolbar-btn" @click="zoomFit">
          <WPIcon :icon="fullscreen" :size="18" />
        </button>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
/* ── Infinite canvas viewport ── */

.sitemap-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  background-color: var(--color-frame-fill);
}

.sitemap-viewport:active {
  cursor: grabbing;
}

/* ── View toggle ── */

.view-toggle {
  position: absolute;
  inset-block-start: var(--space-m);
  inset-inline-start: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  padding: var(--space-xxxs);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.view-toggle-btn {
  padding: var(--space-xxxs) var(--space-s);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.view-toggle-btn:hover {
  color: var(--color-frame-fg);
}

.view-toggle-btn.is-active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

/* ── Floating toolbar ── */

.sitemap-toolbar {
  position: absolute;
  inset-block-end: var(--space-m);
  inset-inline-end: var(--space-m);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  padding: var(--space-xxxs);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.toolbar-btn:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.toolbar-zoom {
  min-width: 40px;
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  font-variant-numeric: tabular-nums;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--color-frame-border);
}

.sitemap-canvas {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  transform-origin: 0 0;
}

.sitemap-canvas.is-moving {
  will-change: transform;
}

/* Grid pattern lives on canvas so it pans/zooms with content */
.sitemap-canvas::before {
  content: '';
  position: absolute;
  /* Extend far beyond content so grid is visible when panning */
  inset: -5000px;
  z-index: -1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cline x1='13' y1='16' x2='19' y2='16' stroke='%23000' stroke-opacity='0.06' stroke-width='0.75'/%3E%3Cline x1='16' y1='13' x2='16' y2='19' stroke='%23000' stroke-opacity='0.06' stroke-width='0.75'/%3E%3Cline x1='19' y1='16' x2='32' y2='16' stroke='%23000' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='0' y1='16' x2='13' y2='16' stroke='%23000' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='16' y1='19' x2='16' y2='32' stroke='%23000' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='16' y1='0' x2='16' y2='13' stroke='%23000' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3C/svg%3E");
  background-size: 24px 24px;
}

@media (prefers-color-scheme: dark) {
  .sitemap-canvas::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cline x1='13' y1='16' x2='19' y2='16' stroke='%23fff' stroke-opacity='0.07' stroke-width='0.75'/%3E%3Cline x1='16' y1='13' x2='16' y2='19' stroke='%23fff' stroke-opacity='0.07' stroke-width='0.75'/%3E%3Cline x1='19' y1='16' x2='32' y2='16' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='0' y1='16' x2='13' y2='16' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='16' y1='19' x2='16' y2='32' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='16' y1='0' x2='16' y2='13' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3C/svg%3E");
  }
}

/* ── Canvas content layout ── */

.sitemap-canvas-content {
  display: flex;
  align-items: flex-start;
  gap: 120px;
}

/* ── Tree structure ── */

.sitemap-root {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Template Parts group ── */

.sitemap-parts-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block-start: 40px;
}

.sitemap-group-label {
  transform-origin: bottom center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-block-end: var(--space-m);
  white-space: nowrap;
}

.sitemap-parts-nodes {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.sitemap-level {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-block-start: 60px;
}

.sitemap-level__nodes {
  display: flex;
  gap: var(--space-l);
  align-items: flex-start;
}

.sitemap-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── SVG connectors ── */

.sitemap-connectors {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.sitemap-connectors path {
  fill: none;
  stroke: var(--color-frame-border);
  stroke-width: calc(1.5 / var(--zoom, 1));
  stroke-linecap: round;
}

/* ── Node ── */

.sitemap-node {
  position: relative;
  cursor: pointer;
}

.sitemap-node .page-thumb {
  transition: outline-color var(--duration-fast) var(--ease-default);
  outline: calc(1.5px / var(--zoom, 1)) solid transparent;
  outline-offset: calc(2px / var(--zoom, 1));
}

.sitemap-node.is-selected .page-thumb {
  outline-color: var(--color-frame-selected);
}

.sitemap-label {
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

.sitemap-label.is-selected {
  color: var(--color-frame-selected);
}

/* ── Collection stack ── */

.sitemap-node--stack {
  padding-block-start: 8px;
  padding-inline-start: 8px;
}

.stack-cards {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.stack-card {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  inset-inline-end: 8px;
  inset-block-end: 8px;
  background: var(--color-frame-bg);
  border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border);
  /* border-radius: calc(var(--radius-s) / var(--zoom, 1)); */
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
}

.stack-card:first-child {
  inset-inline-start: 4px;
  inset-block-start: 4px;
  inset-inline-end: 4px;
  inset-block-end: 4px;
}

.sitemap-badge {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  transform-origin: top right;
  z-index: 3;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--space-xxs);
  border-radius: 10px;
  background: var(--color-theme-bg);
  color: var(--color-theme-fg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  text-align: center;
}

/* ── Page thumbnail container ── */

.page-thumb {
  width: 160px;
  aspect-ratio: 3 / 4;
  border-radius: calc(0.5px / var(--zoom, 1));
  /* border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border); */
  overflow: hidden;
  background: white;
  position: relative;
  z-index: 1;
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
}


/* ── Floating task input ── */

.task-input-float {
  position: absolute;
  z-index: 10;
  transform: translateX(-50%);
  width: 240px;
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
  transform: translateX(-50%) translateY(calc(-1 * var(--space-xs)));
}

/* ── Dark mode ── */

@media (prefers-color-scheme: dark) {
  .page-thumb {
    background: #2c2c2c;
  }

  .stack-card { background: var(--color-frame-bg); }
}
</style>
