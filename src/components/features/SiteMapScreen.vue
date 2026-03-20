<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { plus, fullscreen } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import { useSites } from '@/data/useSites'
import { siteMapTrees } from '@/data/sitemap-content'
import type { SiteMapNode, PageContent } from '@/data/sitemap-content'
import type { MockLayout } from '@/data/types'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(s => s.id === props.siteId))
const layout = computed<MockLayout>(() => site.value?.mockLayout ?? 'default')
const siteName = computed(() => site.value?.name ?? 'My Site')

const tree = computed(() => siteMapTrees[layout.value] ?? siteMapTrees.default)

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

  const children = tree.value.children ?? []
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
      <div class="sitemap-root">
        <div class="sitemap-node" :class="{ 'is-selected': selectedNodeId === 'root' }" data-node-id="root" @click.stop="selectNode('root')">
          <div class="page-thumb">
            <div class="page-mock" :class="`page-mock--${layout}`">
              <!-- Home page renders a simplified version of each layout -->
              <div class="pm-nav">
                <span class="pm-logo">{{ siteName }}</span>
                <div class="pm-nav-links">
                  <span v-for="child in tree.children" :key="child.label">{{ child.label }}</span>
                </div>
              </div>

              <!-- Cafe home -->
              <template v-if="layout === 'cafe' || layout === 'default'">
                <div class="pm-hero">
                  <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=240&fit=crop&q=60" alt="" />
                  <div class="pm-hero-overlay">{{ siteName }}</div>
                </div>
                <div class="pm-card-row">
                  <div class="pm-card"><div class="pm-card-img" /><div class="pm-card-text"><div class="pm-line w60" /><div class="pm-line w40 muted" /></div></div>
                  <div class="pm-card"><div class="pm-card-img" /><div class="pm-card-text"><div class="pm-line w60" /><div class="pm-line w40 muted" /></div></div>
                  <div class="pm-card"><div class="pm-card-img" /><div class="pm-card-text"><div class="pm-line w60" /><div class="pm-line w40 muted" /></div></div>
                </div>
              </template>

              <!-- Blog home -->
              <template v-else-if="layout === 'blog'">
                <div class="pm-blog-layout">
                  <div class="pm-blog-main">
                    <div class="pm-featured-img" />
                    <div class="pm-line w80 bold" />
                    <div class="pm-line w100 muted" />
                    <div class="pm-line w60 muted" />
                    <div class="pm-divider" />
                    <div class="pm-post-row">
                      <div class="pm-post-thumb" />
                      <div class="pm-post-text"><div class="pm-line w80 bold" /><div class="pm-line w100 muted" /></div>
                    </div>
                    <div class="pm-divider" />
                    <div class="pm-post-row">
                      <div class="pm-post-thumb" />
                      <div class="pm-post-text"><div class="pm-line w80 bold" /><div class="pm-line w100 muted" /></div>
                    </div>
                  </div>
                  <div class="pm-blog-sidebar">
                    <div class="pm-line w60 muted small" />
                    <div class="pm-line w80" />
                    <div class="pm-line w80" />
                    <div class="pm-line w80" />
                    <div class="pm-spacer" />
                    <div class="pm-line w60 muted small" />
                    <div class="pm-tag-row">
                      <span class="pm-tag" /><span class="pm-tag" /><span class="pm-tag" />
                    </div>
                  </div>
                </div>
              </template>

              <!-- Portfolio home -->
              <template v-else-if="layout === 'portfolio'">
                <div class="pm-split-hero">
                  <div class="pm-split-text">
                    <div class="pm-line w80 bold large" />
                    <div class="pm-line w100 bold large" />
                    <div class="pm-line w80 muted" />
                    <div class="pm-btn" />
                  </div>
                  <div class="pm-split-img">
                    <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=300&h=240&fit=crop&q=60" alt="" />
                  </div>
                </div>
                <div class="pm-portfolio-grid">
                  <div class="pm-portfolio-cell">
                    <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop&q=60" alt="" />
                  </div>
                  <div class="pm-portfolio-cell">
                    <img src="https://images.unsplash.com/photo-1545235617-9465d2a55698?w=300&h=200&fit=crop&q=60" alt="" />
                  </div>
                </div>
              </template>

              <!-- Store home -->
              <template v-else-if="layout === 'store'">
                <div class="pm-hero pm-hero--short">
                  <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=160&fit=crop&q=60" alt="" />
                  <div class="pm-hero-overlay">Spring Collection</div>
                </div>
                <div class="pm-product-grid">
                  <div v-for="i in 4" :key="i" class="pm-product">
                    <div class="pm-product-img" />
                    <div class="pm-product-info"><div class="pm-line w60" /><div class="pm-line w30 bold" /></div>
                  </div>
                </div>
              </template>

              <!-- Landing home -->
              <template v-else-if="layout === 'landing'">
                <div class="pm-landing-hero">
                  <div class="pm-line w80 bold large center" />
                  <div class="pm-line w60 muted center" />
                  <div class="pm-landing-cta-row"><div class="pm-btn pm-btn--primary" /><div class="pm-line w20 muted" /></div>
                </div>
                <div class="pm-feature-row">
                  <div v-for="i in 3" :key="i" class="pm-feature">
                    <div class="pm-feature-icon" />
                    <div class="pm-line w80 bold center" />
                    <div class="pm-line w100 muted center" />
                  </div>
                </div>
              </template>

              <!-- Docs home -->
              <template v-else-if="layout === 'docs'">
                <div class="pm-docs-layout">
                  <div class="pm-docs-sidebar">
                    <div class="pm-line w60 muted small" />
                    <div v-for="i in 4" :key="i" class="pm-line w80" />
                    <div class="pm-spacer" />
                    <div class="pm-line w60 muted small" />
                    <div v-for="i in 3" :key="i" class="pm-line w80" />
                  </div>
                  <div class="pm-docs-content">
                    <div class="pm-line w40 muted small" />
                    <div class="pm-line w60 bold large" />
                    <div class="pm-line w100 muted" />
                    <div class="pm-line w80 muted" />
                    <div class="pm-spacer" />
                    <div class="pm-line w40 bold" />
                    <div class="pm-line w100 muted" />
                    <div class="pm-code-block" />
                  </div>
                </div>
              </template>

              <!-- Gallery home -->
              <template v-else-if="layout === 'gallery'">
                <div class="pm-gallery-grid">
                  <div class="pm-gallery-col">
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=250&fit=crop&q=60" alt="" />
                    <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=160&fit=crop&q=60" alt="" />
                  </div>
                  <div class="pm-gallery-col">
                    <img src="https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&h=180&fit=crop&q=60" alt="" />
                    <img src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=200&h=240&fit=crop&q=60" alt="" />
                  </div>
                  <div class="pm-gallery-col">
                    <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200&h=220&fit=crop&q=60" alt="" />
                    <img src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&h=180&fit=crop&q=60" alt="" />
                  </div>
                </div>
              </template>
            </div>
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
                  <div class="page-mock" :class="`page-mock--${child.pageType}`">
                    <div class="pm-nav pm-nav--mini">
                      <span class="pm-nav-logo">{{ siteName }}</span>
                      <div class="pm-nav-dots"><span /><span /><span /></div>
                    </div>

                    <!-- Content page -->
                    <template v-if="child.pageType === 'content'">
                      <div class="pm-page-body">
                        <strong class="pm-heading">{{ child.content.heading }}</strong>
                        <div class="pm-spacer-s" />
                        <p v-for="(p, pi) in child.content.body" :key="pi" class="pm-body-text">{{ p }}</p>
                      </div>
                    </template>

                    <!-- Listing page -->
                    <template v-else-if="child.pageType === 'listing'">
                      <div class="pm-page-body">
                        <strong class="pm-heading pm-heading--s">{{ child.content.heading }}</strong>
                        <div class="pm-spacer-s" />
                        <div v-for="item in child.content.items" :key="item.title" class="pm-list-item">
                          <div class="pm-list-thumb" />
                          <div class="pm-list-text">
                            <strong class="pm-item-title">{{ item.title }}</strong>
                            <span v-if="item.desc" class="pm-item-desc">{{ item.desc }}</span>
                            <span v-if="item.meta" class="pm-item-meta">{{ item.meta }}</span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Single post/project -->
                    <template v-else-if="child.pageType === 'single'">
                      <div class="pm-page-body">
                        <div class="pm-featured-img" />
                        <strong class="pm-heading">{{ child.content.heading }}</strong>
                        <span v-if="child.content.subheading" class="pm-meta">{{ child.content.subheading }}</span>
                        <div class="pm-spacer-s" />
                        <p v-for="(p, pi) in child.content.body" :key="pi" class="pm-body-text">{{ p }}</p>
                      </div>
                    </template>

                    <!-- Form page -->
                    <template v-else-if="child.pageType === 'form'">
                      <div class="pm-page-body">
                        <strong class="pm-heading">{{ child.content.heading }}</strong>
                        <span v-if="child.content.subheading" class="pm-meta pm-meta--wrap">{{ child.content.subheading }}</span>
                        <div class="pm-spacer-s" />
                        <div v-for="field in child.content.fields?.slice(0, 4)" :key="field" class="pm-form-row">
                          <span class="pm-field-label">{{ field }}</span>
                          <div class="pm-form-field" />
                        </div>
                        <div class="pm-spacer-s" />
                        <div class="pm-btn pm-btn--primary">{{ child.content.submitLabel }}</div>
                      </div>
                    </template>

                    <!-- Product grid -->
                    <template v-else-if="child.pageType === 'product-grid'">
                      <div class="pm-page-body">
                        <strong class="pm-heading pm-heading--s">{{ child.content.heading }}</strong>
                        <div class="pm-spacer-s" />
                        <div class="pm-product-grid pm-product-grid--compact">
                          <div v-for="item in child.content.items" :key="item.title" class="pm-product">
                            <div class="pm-product-img" />
                            <div class="pm-product-info">
                              <span class="pm-product-name">{{ item.title }}</span>
                              <span class="pm-product-price">{{ item.price }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Product single -->
                    <template v-else-if="child.pageType === 'product-single'">
                      <div class="pm-page-body">
                        <div class="pm-product-hero" />
                        <strong class="pm-heading">{{ child.content.productName }}</strong>
                        <span class="pm-product-price-lg">{{ child.content.productPrice }}</span>
                        <p class="pm-body-text">{{ child.content.productDesc }}</p>
                        <div class="pm-btn pm-btn--primary pm-btn--full">Add to cart</div>
                      </div>
                    </template>

                    <!-- Menu page -->
                    <template v-else-if="child.pageType === 'menu'">
                      <div class="pm-page-body">
                        <strong class="pm-heading">{{ child.content.heading }}</strong>
                        <div class="pm-spacer-s" />
                        <div v-for="cat in child.content.categories" :key="cat.name" class="pm-menu-category">
                          <span class="pm-menu-cat-name">{{ cat.name }}</span>
                          <div v-for="item in cat.items" :key="item.title" class="pm-menu-item">
                            <span class="pm-menu-item-name">{{ item.title }}</span>
                            <span class="pm-menu-item-price">{{ item.price }}</span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Services page -->
                    <template v-else-if="child.pageType === 'services'">
                      <div class="pm-page-body">
                        <strong class="pm-heading">{{ child.content.heading }}</strong>
                        <span v-if="child.content.subheading" class="pm-meta pm-meta--wrap">{{ child.content.subheading }}</span>
                        <div class="pm-spacer-s" />
                        <div class="pm-services-grid">
                          <div v-for="card in child.content.serviceCards" :key="card.title" class="pm-service-card">
                            <span class="pm-service-icon">{{ card.icon }}</span>
                            <strong class="pm-service-title">{{ card.title }}</strong>
                            <span class="pm-service-desc">{{ card.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Pricing page -->
                    <template v-else-if="child.pageType === 'pricing'">
                      <div class="pm-page-body pm-page-body--center">
                        <strong class="pm-heading pm-heading--center">{{ child.content.heading }}</strong>
                        <span v-if="child.content.subheading" class="pm-meta pm-meta--center">{{ child.content.subheading }}</span>
                        <div class="pm-spacer-s" />
                        <div class="pm-pricing-grid">
                          <div v-for="tier in child.content.tiers" :key="tier.name" class="pm-pricing-card" :class="{ 'pm-pricing-card--featured': tier.featured }">
                            <span class="pm-pricing-name">{{ tier.name }}</span>
                            <span class="pm-pricing-price">{{ tier.price }}<small v-if="tier.period">{{ tier.period }}</small></span>
                            <div class="pm-btn" :class="{ 'pm-btn--primary': tier.featured }">{{ tier.cta }}</div>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Gallery page -->
                    <template v-else-if="child.pageType === 'gallery'">
                      <div v-if="child.content.heading" class="pm-page-body pm-page-body--tight">
                        <strong class="pm-heading pm-heading--s">{{ child.content.heading }}</strong>
                      </div>
                      <div class="pm-gallery-grid pm-gallery-grid--page">
                        <div class="pm-gallery-col">
                          <div class="pm-gallery-placeholder" style="aspect-ratio: 3/4" />
                          <div class="pm-gallery-placeholder" style="aspect-ratio: 4/3" />
                        </div>
                        <div class="pm-gallery-col">
                          <div class="pm-gallery-placeholder" style="aspect-ratio: 1/1" />
                          <div class="pm-gallery-placeholder" style="aspect-ratio: 3/4" />
                        </div>
                        <div class="pm-gallery-col">
                          <div class="pm-gallery-placeholder" style="aspect-ratio: 4/3" />
                          <div class="pm-gallery-placeholder" style="aspect-ratio: 1/1" />
                        </div>
                      </div>
                    </template>

                    <!-- Docs page -->
                    <template v-else-if="child.pageType === 'docs'">
                      <div class="pm-docs-layout">
                        <div class="pm-docs-sidebar pm-docs-sidebar--mini">
                          <template v-for="section in child.content.sidebarSections" :key="section.title">
                            <span class="pm-docs-section-label">{{ section.title }}</span>
                            <a v-for="item in section.items" :key="item.label" class="pm-docs-nav-item" :class="{ 'is-active': item.active }">{{ item.label }}</a>
                          </template>
                        </div>
                        <div class="pm-docs-content">
                          <strong class="pm-heading pm-heading--s">{{ child.content.heading }}</strong>
                          <p v-for="(p, pi) in child.content.body" :key="pi" class="pm-body-text">{{ p }}</p>
                          <div v-if="child.content.code" class="pm-code-block"><code>{{ child.content.code }}</code></div>
                        </div>
                      </div>
                    </template>

                    <!-- Cart page -->
                    <template v-else-if="child.pageType === 'cart'">
                      <div class="pm-page-body">
                        <strong class="pm-heading">{{ child.content.heading }}</strong>
                        <div class="pm-spacer-s" />
                        <div v-for="item in child.content.cartItems" :key="item.name" class="pm-cart-item">
                          <div class="pm-cart-thumb" />
                          <div class="pm-cart-text">
                            <span class="pm-item-title">{{ item.name }}</span>
                            <span class="pm-product-price">{{ item.price }}</span>
                          </div>
                        </div>
                        <div class="pm-divider" />
                        <div class="pm-cart-total">
                          <span class="pm-item-title">Total</span>
                          <span class="pm-product-price-lg">{{ child.content.cartTotal }}</span>
                        </div>
                        <div class="pm-btn pm-btn--primary pm-btn--full">{{ child.content.submitLabel }}</div>
                      </div>
                    </template>
                  </div>
                </div>
                <span v-if="child.isCollection" class="sitemap-badge" :style="{ transform: badgeTransform }">{{ child.collectionCount }}</span>
              </div>
              <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === String(ci) }" :style="{ transform: labelScale }" @click.stop="selectNode(String(ci))">{{ child.label }}</span>

              <!-- Level 2 children (reuse same templates with gc node) -->
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
                          <div class="page-mock" :class="`page-mock--${gc.pageType}`">
                            <div class="pm-nav pm-nav--mini">
                              <span class="pm-nav-logo">{{ siteName }}</span>
                              <div class="pm-nav-dots"><span /><span /><span /></div>
                            </div>

                            <!-- Single -->
                            <template v-if="gc.pageType === 'single'">
                              <div class="pm-page-body">
                                <div class="pm-featured-img" />
                                <strong class="pm-heading">{{ gc.content.heading }}</strong>
                                <span v-if="gc.content.subheading" class="pm-meta">{{ gc.content.subheading }}</span>
                                <div class="pm-spacer-s" />
                                <p v-for="(p, pi) in gc.content.body" :key="pi" class="pm-body-text">{{ p }}</p>
                              </div>
                            </template>

                            <!-- Product single -->
                            <template v-else-if="gc.pageType === 'product-single'">
                              <div class="pm-page-body">
                                <div class="pm-product-hero" />
                                <strong class="pm-heading">{{ gc.content.productName }}</strong>
                                <span class="pm-product-price-lg">{{ gc.content.productPrice }}</span>
                                <p class="pm-body-text">{{ gc.content.productDesc }}</p>
                                <div class="pm-btn pm-btn--primary pm-btn--full">Add to cart</div>
                              </div>
                            </template>

                            <!-- Docs -->
                            <template v-else-if="gc.pageType === 'docs'">
                              <div class="pm-docs-layout">
                                <div class="pm-docs-sidebar pm-docs-sidebar--mini">
                                  <template v-for="section in gc.content.sidebarSections" :key="section.title">
                                    <span class="pm-docs-section-label">{{ section.title }}</span>
                                    <a v-for="item in section.items" :key="item.label" class="pm-docs-nav-item" :class="{ 'is-active': item.active }">{{ item.label }}</a>
                                  </template>
                                </div>
                                <div class="pm-docs-content">
                                  <strong class="pm-heading pm-heading--s">{{ gc.content.heading }}</strong>
                                  <p v-for="(p, pi) in gc.content.body" :key="pi" class="pm-body-text">{{ p }}</p>
                                  <div v-if="gc.content.code" class="pm-code-block"><code>{{ gc.content.code }}</code></div>
                                </div>
                              </div>
                            </template>

                            <!-- Gallery -->
                            <template v-else-if="gc.pageType === 'gallery'">
                              <div v-if="gc.content.heading" class="pm-page-body pm-page-body--tight">
                                <strong class="pm-heading pm-heading--s">{{ gc.content.heading }}</strong>
                              </div>
                              <div class="pm-gallery-grid pm-gallery-grid--page">
                                <div class="pm-gallery-col">
                                  <div class="pm-gallery-placeholder" style="aspect-ratio: 3/4" />
                                  <div class="pm-gallery-placeholder" style="aspect-ratio: 4/3" />
                                </div>
                                <div class="pm-gallery-col">
                                  <div class="pm-gallery-placeholder" style="aspect-ratio: 1/1" />
                                  <div class="pm-gallery-placeholder" style="aspect-ratio: 3/4" />
                                </div>
                              </div>
                            </template>
                          </div>
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


/* ── Page mock (scaled down from 800px to 160px = 0.2 scale) ── */

.page-mock {
  width: 800px;
  transform-origin: top left;
  transform: scale(0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fff;
  color: #1a1a1a;
  overflow: hidden;
  text-align: start;
}

.page-mock--portfolio,
.page-mock--gallery {
  background: #111;
  color: #fff;
}

/* ── Shared nav ── */

.pm-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  border-block-end: 1px solid rgba(0, 0, 0, 0.08);
}

.page-mock--portfolio .pm-nav,
.page-mock--gallery .pm-nav {
  background: #1a1a1a;
  border-block-end-color: rgba(255, 255, 255, 0.08);
}

.pm-nav--mini {
  padding: 10px 24px;
}

.pm-logo {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.pm-nav-logo {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.pm-nav-links {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
}

.page-mock--portfolio .pm-nav-links,
.page-mock--gallery .pm-nav-links {
  color: rgba(255, 255, 255, 0.5);
}

.pm-nav-dots {
  display: flex;
  gap: 16px;
}

.pm-nav-dots span {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
}

.page-mock--portfolio .pm-nav-dots span,
.page-mock--gallery .pm-nav-dots span {
  background: rgba(255, 255, 255, 0.12);
}

/* ── Page body ── */

.pm-page-body {
  padding: 28px 32px;
}

.pm-page-body--center {
  text-align: center;
}

.pm-page-body--tight {
  padding: 20px 24px 8px;
}

/* ── Typography ── */

.pm-heading {
  display: block;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 6px;
}

.pm-heading--s { font-size: 18px; }
.pm-heading--center { text-align: center; }

.pm-meta {
  display: block;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.pm-meta--wrap { white-space: pre-line; }
.pm-meta--center { text-align: center; }

.page-mock--portfolio .pm-meta,
.page-mock--gallery .pm-meta {
  color: rgba(255, 255, 255, 0.4);
}

.pm-body-text {
  font-size: 13px;
  line-height: 1.6;
  color: #555;
  margin: 0 0 10px;
}

.page-mock--portfolio .pm-body-text,
.page-mock--gallery .pm-body-text {
  color: rgba(255, 255, 255, 0.5);
}

.pm-spacer { height: 20px; }
.pm-spacer-s { height: 10px; }

.pm-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin-block: 16px;
}

/* ── Listing ── */

.pm-list-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 12px 0;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
}

.pm-list-thumb {
  width: 80px;
  height: 56px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.pm-list-text { flex: 1; }

.pm-item-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  margin-block-end: 2px;
}

.pm-item-desc {
  display: block;
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.pm-item-meta {
  display: block;
  font-size: 11px;
  color: #bbb;
  margin-block-start: 2px;
}

/* ── Featured image ── */

.pm-featured-img {
  aspect-ratio: 2 / 1;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  margin-block-end: 16px;
}

/* ── Buttons ── */

.pm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 32px;
  padding: 0 20px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  margin-block-start: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.pm-btn--primary {
  background: #2563eb;
  color: #fff;
}

.pm-btn--full {
  width: 100%;
}

.page-mock--portfolio .pm-btn {
  background: #fff;
  color: #111;
}

/* ── Form ── */

.pm-form-row {
  margin-block-end: 12px;
}

.pm-field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  margin-block-end: 4px;
}

.pm-form-field {
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

/* ── Menu ── */

.pm-menu-category {
  margin-block-end: 20px;
}

.pm-menu-cat-name {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  padding-block-end: 6px;
  margin-block-end: 6px;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
}

.pm-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px 0;
}

.pm-menu-item-name {
  font-size: 14px;
  color: #333;
}

.pm-menu-item-price {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

/* ── Services grid ── */

.pm-services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.pm-service-card {
  padding: 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
}

.page-mock--portfolio .pm-service-card {
  background: rgba(255, 255, 255, 0.05);
}

.pm-service-icon {
  font-size: 18px;
  display: block;
  margin-block-end: 6px;
}

.pm-service-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-block-end: 4px;
}

.pm-service-desc {
  display: block;
  font-size: 11px;
  color: #888;
  line-height: 1.5;
}

.page-mock--portfolio .pm-service-desc {
  color: rgba(255, 255, 255, 0.4);
}

/* ── Pricing ── */

.pm-pricing-grid {
  display: flex;
  gap: 10px;
}

.pm-pricing-card {
  flex: 1;
  padding: 16px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pm-pricing-card--featured {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.04);
}

.pm-pricing-name {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #888;
}

.pm-pricing-price {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.pm-pricing-price small {
  font-size: 12px;
  font-weight: 400;
  color: #999;
}

/* ── Product ── */

.pm-product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 0;
}

.pm-product-grid--compact {
  grid-template-columns: repeat(3, 1fr);
}

.pm-product {
  border-radius: 8px;
  overflow: hidden;
  background: #f8f8f8;
}

.pm-product-img {
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.05);
}

.pm-product-info {
  padding: 8px 10px;
}

.pm-product-name {
  display: block;
  font-size: 12px;
  color: #555;
  line-height: 1.3;
}

.pm-product-price {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
}

.pm-product-hero {
  aspect-ratio: 4 / 3;
  background: #f0f0f0;
  border-radius: 8px;
  margin-block-end: 16px;
}

.pm-product-price-lg {
  display: block;
  font-size: 22px;
  font-weight: 700;
  margin-block-end: 8px;
}

/* ── Cart ── */

.pm-cart-item {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
}

.pm-cart-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #f0f0f0;
  flex-shrink: 0;
}

.pm-cart-text {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pm-cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

/* ── Docs ── */

.pm-docs-layout {
  display: flex;
  min-height: 400px;
}

.pm-docs-sidebar {
  width: 180px;
  flex-shrink: 0;
  padding: 16px 12px;
  border-inline-end: 1px solid rgba(0, 0, 0, 0.06);
}

.pm-docs-sidebar--mini {
  width: 150px;
  padding: 14px 10px;
}

.pm-docs-content {
  flex: 1;
  padding: 16px 24px;
}

.pm-docs-section-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin: 14px 0 6px;
}

.pm-docs-section-label:first-child {
  margin-block-start: 0;
}

.pm-docs-nav-item {
  display: block;
  padding: 4px 8px;
  font-size: 12px;
  color: #555;
  text-decoration: none;
  border-radius: 4px;
  line-height: 1.5;
}

.pm-docs-nav-item.is-active {
  background: #e8f0fe;
  color: #1a56db;
  font-weight: 600;
}

.pm-code-block {
  border-radius: 6px;
  background: #1e293b;
  padding: 14px 16px;
  margin-block-start: 12px;
}

.pm-code-block code {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre;
}

/* ── Gallery ── */

.pm-gallery-grid {
  display: flex;
  gap: 6px;
  padding: 6px;
}

.pm-gallery-grid--page {
  padding: 16px;
  gap: 10px;
}

.pm-gallery-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pm-gallery-grid--page .pm-gallery-col {
  gap: 10px;
}

.pm-gallery-col img {
  width: 100%;
  display: block;
  border-radius: 4px;
  object-fit: cover;
}

.pm-gallery-placeholder {
  width: 100%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
}

/* ── Home-specific layouts ── */

.pm-hero {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.pm-hero--short { height: 140px; }

.pm-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pm-hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: white;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.pm-card-row {
  display: flex;
  gap: 14px;
  padding: 18px 24px;
}

.pm-card {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.pm-card-img {
  aspect-ratio: 16 / 10;
  background: rgba(0, 0, 0, 0.07);
}

.pm-card-text {
  padding: 10px 12px;
}

.pm-line {
  height: 8px;
  border-radius: 4px;
  background: #1a1a1a;
  margin-block-end: 6px;
}

.page-mock--portfolio .pm-line,
.page-mock--gallery .pm-line {
  background: #fff;
}

.pm-line.muted { opacity: 0.12; }
.pm-line.bold { opacity: 0.7; height: 9px; }
.pm-line.large { height: 12px; }
.pm-line.small { height: 5px; }
.pm-line.center { margin-inline: auto; }
.pm-line.w20 { width: 20%; }
.pm-line.w30 { width: 30%; }
.pm-line.w40 { width: 40%; }
.pm-line.w50 { width: 50%; }
.pm-line.w60 { width: 60%; }
.pm-line.w80 { width: 80%; }
.pm-line.w100 { width: 100%; }

.pm-blog-layout {
  display: flex;
  gap: 28px;
  padding: 20px 32px;
}

.pm-blog-main { flex: 2; }
.pm-blog-sidebar { flex: 1; }

.pm-post-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-block-end: 10px;
}

.pm-post-thumb {
  width: 80px;
  height: 52px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.pm-post-text { flex: 1; }

.pm-tag-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pm-tag {
  width: 48px;
  height: 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
}

.pm-split-hero {
  display: flex;
  gap: 28px;
  padding: 36px 32px;
  align-items: center;
}

.pm-split-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pm-split-img {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
}

.pm-split-img img {
  width: 100%;
  aspect-ratio: 5 / 4;
  object-fit: cover;
  display: block;
}

.pm-portfolio-grid {
  display: flex;
  gap: 14px;
  padding: 0 32px 28px;
}

.pm-portfolio-cell {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
}

.pm-portfolio-cell img {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  display: block;
}

.pm-landing-hero {
  padding: 44px 32px 36px;
  text-align: center;
}

.pm-landing-cta-row {
  display: flex;
  gap: 14px;
  justify-content: center;
  align-items: center;
  margin-block-start: 18px;
}

.pm-feature-row {
  display: flex;
  gap: 20px;
  padding: 0 48px 28px;
}

.pm-feature {
  flex: 1;
  text-align: center;
}

.pm-feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e8f0fe;
  margin: 0 auto 10px;
}

/* ── Dark mode ── */

@media (prefers-color-scheme: dark) {
  .page-thumb {
    background: #2c2c2c;
  }

  .page-mock {
    background: #2c2c2c;
    color: #fff;
  }

  .page-mock--portfolio,
  .page-mock--gallery {
    background: #111;
  }

  .pm-nav {
    border-block-end-color: rgba(255, 255, 255, 0.06);
  }

  .pm-nav-dots span {
    background: rgba(255, 255, 255, 0.1);
  }

  .pm-body-text { color: rgba(255, 255, 255, 0.45); }
  .pm-meta { color: rgba(255, 255, 255, 0.35); }
  .pm-item-title { color: #fff; }
  .pm-item-desc { color: rgba(255, 255, 255, 0.4); }
  .pm-item-meta { color: rgba(255, 255, 255, 0.3); }
  .pm-field-label { color: rgba(255, 255, 255, 0.4); }
  .pm-product-name { color: rgba(255, 255, 255, 0.6); }
  .pm-product-price { color: #fff; }
  .pm-pricing-name { color: rgba(255, 255, 255, 0.4); }

  .pm-line { background: #fff; }
  .pm-line.muted { opacity: 0.1; }
  .pm-line.bold { opacity: 0.6; }

  .pm-card, .pm-product { background: rgba(255, 255, 255, 0.05); }
  .pm-card-img, .pm-product-img, .pm-featured-img, .pm-post-thumb,
  .pm-list-thumb, .pm-cart-thumb, .pm-product-hero { background: rgba(255, 255, 255, 0.07); }
  .pm-form-field { border-color: rgba(255, 255, 255, 0.1); }
  .pm-divider, .pm-list-item, .pm-cart-item { border-color: rgba(255, 255, 255, 0.06); }
  .pm-menu-cat-name { color: rgba(255, 255, 255, 0.4); border-block-end-color: rgba(255, 255, 255, 0.06); }
  .pm-menu-item-name { color: rgba(255, 255, 255, 0.8); }
  .pm-menu-item-price { color: rgba(255, 255, 255, 0.5); }
  .pm-service-card { background: rgba(255, 255, 255, 0.04); }
  .pm-service-desc { color: rgba(255, 255, 255, 0.35); }
  .pm-pricing-card { border-color: rgba(255, 255, 255, 0.08); }
  .pm-pricing-card--featured { border-color: #3b82f6; background: rgba(59, 130, 246, 0.08); }
  .pm-btn { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); }
  .pm-btn--primary { background: #3b82f6; color: #fff; }
  .pm-docs-sidebar { border-inline-end-color: rgba(255, 255, 255, 0.06); }
  .pm-docs-section-label { color: rgba(255, 255, 255, 0.35); }
  .pm-docs-nav-item { color: rgba(255, 255, 255, 0.5); }
  .pm-docs-nav-item.is-active { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
  .pm-code-block { background: #0f172a; }
  .pm-gallery-placeholder { background: rgba(255, 255, 255, 0.06); }
  .pm-hero-overlay { background: rgba(0, 0, 0, 0.5); }
  .pm-tag { background: rgba(255, 255, 255, 0.06); }
  .pm-feature-icon { background: rgba(59, 130, 246, 0.15); }
  .page-mock--portfolio .pm-btn { background: rgba(255, 255, 255, 0.85); color: #111; }
  .stack-card { background: var(--color-frame-bg); }
}
</style>
