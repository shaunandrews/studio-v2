import { hierarchy, tree as d3tree } from 'd3-hierarchy'
import type { CanvasNode } from './useSiteTemplates'

// ── Types ──

export interface HandlePoint {
  x: number
  y: number
}

export interface CanvasLayoutNode {
  id: string
  label: string
  slug: string
  x: number
  y: number
  width: number
  height: number
  sourceHandle: HandlePoint
  targetHandle: HandlePoint
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
// THUMB_HEIGHT derived from NODE_WIDTH and aspect ratio — change ASPECT_RATIO
// and everything stays consistent. SitePageThumb.vue uses the same 3/2 ratio.

const ASPECT_RATIO = 3 / 2
const NODE_WIDTH = 160
const THUMB_HEIGHT = Math.round(NODE_WIDTH / ASPECT_RATIO)
const LABEL_GAP = 37
const NODE_HEIGHT = THUMB_HEIGHT + LABEL_GAP
const GAP_X = 32
const GAP_Y = 60
const CORNER_RADIUS = 8

// ── Smooth-step path ──

/**
 * Build an orthogonal path from source handle to target handle with rounded
 * corners (quadratic bezier). The path goes: down from source → horizontal
 * rail at midpoint → down to target. Corner radius is clamped so curves
 * never exceed available space.
 */
function smoothStepPath(
  sx: number, sy: number,
  tx: number, ty: number,
): string {
  // Straight vertical line when horizontally aligned
  if (Math.abs(tx - sx) < 1) {
    return `M ${sx},${sy} L ${tx},${ty}`
  }

  const midY = Math.round((sy + ty) / 2)
  const dx = tx - sx
  const halfVert = Math.min(Math.abs(midY - sy), Math.abs(ty - midY))
  const halfHoriz = Math.abs(dx)
  const r = Math.min(CORNER_RADIUS, halfVert, halfHoriz / 2)

  const dir = dx > 0 ? 1 : -1

  // Source down to first corner
  const c1y = midY - r
  // First corner: turn from vertical to horizontal
  const c1qx = sx
  const c1qy = midY
  const c1ex = sx + r * dir
  const c1ey = midY

  // Horizontal rail to second corner
  const c2sx = tx - r * dir
  const c2sy = midY
  // Second corner: turn from horizontal to vertical
  const c2qx = tx
  const c2qy = midY
  const c2ex = tx
  const c2ey = midY + r

  return [
    `M ${sx},${sy}`,
    `L ${sx},${c1y}`,
    `Q ${c1qx},${c1qy} ${c1ex},${c1ey}`,
    `L ${c2sx},${c2sy}`,
    `Q ${c2qx},${c2qy} ${c2ex},${c2ey}`,
    `L ${tx},${ty}`,
  ].join(' ')
}

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
    const nodeX = cx - NODE_WIDTH / 2

    nodes.push({
      id: d.data.id,
      label: d.data.label,
      slug: d.data.slug,
      x: nodeX,
      y,
      width: NODE_WIDTH,
      height: THUMB_HEIGHT,
      sourceHandle: { x: cx, y: y + THUMB_HEIGHT },
      targetHandle: { x: cx, y },
      isCollection: d.data.isCollection,
      collectionCount: d.data.collectionCount,
    })
  })

  // Build one connector per parent → child pair with smooth-step paths.
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  root.each(d => {
    if (!d.children) return
    const parent = nodeMap.get(d.data.id)!

    for (const child of d.children) {
      const childNode = nodeMap.get(child.data.id)!

      connectors.push({
        id: `${d.data.id}->${child.data.id}`,
        sourceId: d.data.id,
        targetId: child.data.id,
        path: smoothStepPath(
          parent.sourceHandle.x, parent.sourceHandle.y,
          childNode.targetHandle.x, childNode.targetHandle.y,
        ),
      })
    }
  })

  return {
    nodes,
    connectors,
    width: maxX - minX,
    height: maxY,
  }
}
