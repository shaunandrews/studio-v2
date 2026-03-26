import { hierarchy, tree as d3tree } from 'd3-hierarchy'
import type { CanvasNode } from './useSiteTemplates'

// ── Types ──

export interface CanvasLayoutNode {
  id: string
  label: string
  slug: string
  x: number
  y: number
  width: number
  height: number
  isCollection?: boolean
  collectionCount?: number
}

export interface CanvasConnector {
  id: string
  sourceId: string
  targetId: string
  path: string
}

export interface CanvasLayout {
  nodes: CanvasLayoutNode[]
  connectors: CanvasConnector[]
  width: number
  height: number
}

// ── Constants ──

const NODE_WIDTH = 160
const THUMB_HEIGHT = 213  // actual page thumbnail height (160 × 3/4)
const NODE_HEIGHT = 250   // total space per node (thumb + label gap above)
const GAP_X = 32
const GAP_Y = 60

// ── Path computation ──

// ── Layout computation ──

interface TreeDatum {
  id: string
  label: string
  slug: string
  isCollection?: boolean
  collectionCount?: number
  children?: TreeDatum[]
}

function canvasNodeToTreeDatum(node: CanvasNode, id: string): TreeDatum {
  const datum: TreeDatum = {
    id,
    label: node.label,
    slug: node.slug,
    isCollection: node.isCollection,
    collectionCount: node.collectionCount,
  }
  if (node.children?.length) {
    datum.children = node.children.map((child, i) => {
      const childId = id === 'root' ? String(i) : `${id}-${i}`
      return canvasNodeToTreeDatum(child, childId)
    })
  }
  return datum
}

/**
 * Compute positions for all nodes and connector paths from a CanvasNode tree.
 * Uses d3-hierarchy's Reingold-Tilford algorithm — O(n), handles any depth/width.
 */
export function computeCanvasLayout(tree: CanvasNode): CanvasLayout {
  const datum = canvasNodeToTreeDatum(tree, 'root')
  const root = hierarchy(datum)

  // d3.tree nodeSize sets spacing between node centers
  const layoutFn = d3tree<TreeDatum>().nodeSize([NODE_WIDTH + GAP_X, NODE_HEIGHT + GAP_Y])
  layoutFn(root)

  // d3 tree centers root at (0, 0) with x as horizontal, y as depth.
  // Collect all positions to compute bounds.
  const nodes: CanvasLayoutNode[] = []
  const connectors: CanvasConnector[] = []

  let minX = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  root.each(d => {
    const x = d.x! // horizontal center from d3
    const y = d.y! // vertical position (depth) from d3
    if (x - NODE_WIDTH / 2 < minX) minX = x - NODE_WIDTH / 2
    if (x + NODE_WIDTH / 2 > maxX) maxX = x + NODE_WIDTH / 2
    if (y + THUMB_HEIGHT > maxY) maxY = y + THUMB_HEIGHT
  })

  // Shift so top-left is at (0, 0)
  const offsetX = -minX
  const offsetY = 0 // root y is already 0

  root.each(d => {
    const cx = d.x! + offsetX
    const y = d.y! + offsetY

    nodes.push({
      id: d.data.id,
      label: d.data.label,
      slug: d.data.slug,
      x: cx - NODE_WIDTH / 2, // top-left x
      y,                       // top-left y
      width: NODE_WIDTH,
      height: THUMB_HEIGHT,
      isCollection: d.data.isCollection,
      collectionCount: d.data.collectionCount,
    })
  })

  // Build one combined connector per parent → all its children.
  // Single path: trunk down, horizontal rail, vertical drops. No overlapping segments.
  root.each(d => {
    if (!d.children) return
    const parentCx = d.x! + offsetX
    const parentBottom = d.y! + offsetY + THUMB_HEIGHT

    const childCoords = d.children.map(child => ({
      cx: child.x! + offsetX,
      top: child.y! + offsetY,
      id: child.data.id,
    }))

    const railY = Math.round((parentBottom + Math.min(...childCoords.map(c => c.top))) / 2)

    // Single child directly below — one straight vertical line
    if (childCoords.length === 1 && Math.abs(childCoords[0].cx - parentCx) < 1) {
      connectors.push({
        id: `${d.data.id}->children`,
        sourceId: d.data.id,
        targetId: childCoords[0].id,
        path: `M ${parentCx},${parentBottom} L ${parentCx},${childCoords[0].top}`,
      })
      return
    }

    // Build a single non-overlapping path:
    // 1. Trunk: parent center down to rail
    // 2. Rail: horizontal from leftmost child to rightmost child
    // 3. Drops: rail down to each child
    const sorted = [...childCoords].sort((a, b) => a.cx - b.cx)
    const parts: string[] = [
      `M ${parentCx},${parentBottom} L ${parentCx},${railY}`,
      `M ${sorted[0].cx},${railY} L ${sorted[sorted.length - 1].cx},${railY}`,
    ]
    for (const c of sorted) {
      parts.push(`M ${c.cx},${railY} L ${c.cx},${c.top}`)
    }

    connectors.push({
      id: `${d.data.id}->children`,
      sourceId: d.data.id,
      targetId: sorted.map(c => c.id).join(','),
      path: parts.join(' '),
    })
  })

  return {
    nodes,
    connectors,
    width: maxX - minX,
    height: maxY,
  }
}
