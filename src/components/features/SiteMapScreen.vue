<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { plus, fullscreen } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import { useSites } from '@/data/useSites'
import { sites as siteRegistry } from '@/data/sites/index'
import { assemblePage, deriveSiteMapTree } from '@/data/useSiteTemplates'
import type { SiteMapNode } from '@/data/useSiteTemplates'
import SitePageThumb from '@/components/composites/SitePageThumb.vue'
import type { MockLayout } from '@/data/types'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(s => s.id === props.siteId))
const layout = computed<MockLayout>(() => site.value?.mockLayout ?? 'default')
const siteFiles = computed(() => siteRegistry[layout.value] ?? null)
const tree = computed<SiteMapNode | null>(() => {
  if (siteFiles.value) return deriveSiteMapTree(siteFiles.value.config)
  return null
})

function getPageHtml(templateName: string): string {
  if (!siteFiles.value) return ''
  return assemblePage(siteFiles.value, templateName)
}

/* ── Infinite canvas (pan & zoom) ── */

const viewportRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)

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

// Pan via pointer drag (any button except right-click)
let isPanning = false
let panStartX = 0
let panStartY = 0
let panOriginX = 0
let panOriginY = 0

function onPointerDown(e: PointerEvent) {
  // Middle mouse or space+click — but for simplicity, just any click on the background
  if (e.button === 2) return
  // Only start pan if clicking on the viewport background
  const target = e.target as HTMLElement
  if (target.closest('.sitemap-node') || target.closest('.sitemap-label') || target.closest('.sitemap-toolbar')) return

  deselectAll()
  isPanning = true
  panStartX = e.clientX
  panStartY = e.clientY
  panOriginX = panX.value
  panOriginY = panY.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isPanning) return
  panX.value = panOriginX + (e.clientX - panStartX)
  panY.value = panOriginY + (e.clientY - panStartY)
  requestConnectorUpdate()
}

function onPointerUp() {
  isPanning = false
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
    const newZoom = Math.min(3, Math.max(0.15, zoom.value * (1 + delta)))
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
  requestConnectorUpdate()
}

// Center the tree on mount
function centerCanvas() {
  const viewport = viewportRef.value
  const canvas = canvasRef.value
  if (!viewport || !canvas) return

  // Temporarily reset transform so we can measure natural content size
  const prevTransform = canvas.style.transform
  canvas.style.transform = 'none'

  const root = canvas.querySelector('.sitemap-root') as HTMLElement | null
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

const zoomPercent = computed(() => Math.round(zoom.value * 100))

function zoomBy(delta: number) {
  const viewport = viewportRef.value
  if (!viewport) return
  const rect = viewport.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  const newZoom = Math.min(3, Math.max(0.15, zoom.value + delta))
  const scale = newZoom / zoom.value
  panX.value = cx - scale * (cx - panX.value)
  panY.value = cy - scale * (cy - panY.value)
  zoom.value = newZoom
  requestConnectorUpdate()
}

function zoomIn() { zoomBy(0.15) }
function zoomOut() { zoomBy(-0.15) }
function zoomFit() {
  centerCanvas()
  requestConnectorUpdate()
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
})

watch(tree, () => nextTick(() => {
  centerCanvas()
  nextTick(() => computeConnectors())
}))
</script>

<template>
  <div
    ref="viewportRef"
    class="sitemap-viewport"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div ref="canvasRef" class="sitemap-canvas" :style="canvasStyle">
      <!-- SVG connector layer -->
      <svg class="sitemap-connectors" aria-hidden="true">
        <path :d="connectorPath" />
      </svg>
      <!-- Root / Home -->
      <div v-if="tree" class="sitemap-root">
        <div class="sitemap-node" :class="{ 'is-selected': selectedNodeId === 'root' }" data-node-id="root" @click.stop="selectNode('root')">
          <div class="page-thumb">
            <SitePageThumb v-if="siteFiles" :html="getPageHtml(tree.template)" />
          </div>
          <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === 'root' }" :style="{ transform: labelScale }" @click.stop="selectNode('root')">{{ tree.label }}</span>
        </div>

        <!-- Level 1 -->
        <div v-if="tree.children?.length" class="sitemap-level">
          <div class="sitemap-level__nodes">
            <div v-for="(child, ci) in tree.children" :key="child.label" class="sitemap-branch">
              <div class="sitemap-node" :data-node-id="ci" :class="{ 'sitemap-node--stack': child.isCollection, 'is-selected': selectedNodeId === String(ci) }" @click.stop="selectNode(String(ci))">
                <div v-if="child.isCollection" class="stack-cards">
                  <div class="stack-card" />
                  <div class="stack-card" />
                </div>
                <div class="page-thumb">
                  <SitePageThumb v-if="siteFiles" :html="getPageHtml(child.template)" />
                </div>
                <span v-if="child.isCollection" class="sitemap-badge" :style="{ transform: badgeTransform }">{{ child.collectionCount }}</span>
              </div>
              <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === String(ci) }" :style="{ transform: labelScale }" @click.stop="selectNode(String(ci))">{{ child.label }}</span>

              <!-- Level 2 children -->
              <template v-if="child.children?.length">
                <div class="sitemap-level sitemap-level--sub">
                  <div class="sitemap-level__nodes">
                    <div v-for="(gc, gci) in child.children" :key="gc.label" class="sitemap-branch">
                      <div class="sitemap-node" :data-node-id="`${ci}-${gci}`" :class="{ 'sitemap-node--stack': gc.isCollection, 'is-selected': selectedNodeId === `${ci}-${gci}` }" @click.stop="selectNode(`${ci}-${gci}`)">
                        <div v-if="gc.isCollection" class="stack-cards">
                          <div class="stack-card" />
                          <div class="stack-card" />
                        </div>
                        <div class="page-thumb">
                          <SitePageThumb v-if="siteFiles" :html="getPageHtml(gc.template)" />
                        </div>
                        <span v-if="gc.isCollection" class="sitemap-badge" :style="{ transform: badgeTransform }">{{ gc.collectionCount }}</span>
                      </div>
                      <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === `${ci}-${gci}` }" :style="{ transform: labelScale }" @click.stop="selectNode(`${ci}-${gci}`)">{{ gc.label }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
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
  background-color: var(--color-frame-bg);
}

.sitemap-viewport:active {
  cursor: grabbing;
}

/* ── Floating toolbar ── */

.sitemap-toolbar {
  position: absolute;
  inset-block-end: var(--space-m);
  inset-inline-start: 50%;
  transform: translateX(-50%);
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
  background-size: 32px 32px;
}

@media (prefers-color-scheme: dark) {
  .sitemap-canvas::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cline x1='13' y1='16' x2='19' y2='16' stroke='%23fff' stroke-opacity='0.07' stroke-width='0.75'/%3E%3Cline x1='16' y1='13' x2='16' y2='19' stroke='%23fff' stroke-opacity='0.07' stroke-width='0.75'/%3E%3Cline x1='19' y1='16' x2='32' y2='16' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='0' y1='16' x2='13' y2='16' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='16' y1='19' x2='16' y2='32' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3Cline x1='16' y1='0' x2='16' y2='13' stroke='%23fff' stroke-opacity='0.03' stroke-width='0.75' stroke-dasharray='1 3'/%3E%3C/svg%3E");
  }
}

/* ── Tree structure ── */

.sitemap-root {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  outline: calc(2px / var(--zoom, 1)) solid transparent;
}

.sitemap-node.is-selected .page-thumb {
  outline-color: var(--color-theme-bg);
}

.sitemap-label {
  display: block;
  margin-block-start: var(--space-s);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  color: var(--color-frame-fg);
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
}

.sitemap-label.is-selected {
  color: var(--color-theme-bg);
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
  /* border-radius: calc(var(--radius-s) / var(--zoom, 1)); */
  border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border);
  overflow: hidden;
  background: white;
  position: relative;
  z-index: 1;
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
}


/* ── Dark mode ── */

@media (prefers-color-scheme: dark) {
  .page-thumb {
    background: #2c2c2c;
  }

  .stack-card { background: var(--color-frame-bg); }
}
</style>
