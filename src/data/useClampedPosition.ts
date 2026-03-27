import { computed, type Ref, type ComputedRef } from 'vue'

const EDGE_PADDING = 8

interface ClampedPositionOptions {
  /** Container element that defines the clamp boundary */
  containerRef: Ref<HTMLElement | null> | ComputedRef<HTMLElement | null>
  /** Raw unclamped position: x = center of anchor, y = below anchor (includes gap) */
  rawPos: Ref<{ x: number; y: number } | null> | ComputedRef<{ x: number; y: number } | null>
  /** Panel width in px */
  panelWidth?: number
  /** Estimated panel height in px */
  panelHeight?: number
  /** Gap between anchor and panel (used for flip-above calculation) */
  gap?: number
  /** Height of the anchor element (used for flip-above calculation) */
  anchorHeight?: Ref<number> | ComputedRef<number>
}

interface ClampedResult {
  left: number
  top: number
  flipped: boolean
}

export function useClampedPosition(options: ClampedPositionOptions): ComputedRef<ClampedResult | null> {
  const {
    containerRef,
    rawPos,
    panelWidth = 240,
    panelHeight = 68,
    gap = 8,
    anchorHeight,
  } = options

  return computed(() => {
    const pos = rawPos.value
    const container = containerRef.value
    if (!pos || !container) return null

    const cw = container.clientWidth
    const ch = container.clientHeight

    // Horizontal: center the panel on rawPos.x, then clamp to edges
    let left = pos.x - panelWidth / 2
    if (left < EDGE_PADDING) left = EDGE_PADDING
    if (left + panelWidth > cw - EDGE_PADDING) left = cw - EDGE_PADDING - panelWidth

    // Vertical: rawPos.y is already below the anchor (includes gap)
    let top = pos.y
    let flipped = false

    if (top + panelHeight > ch - EDGE_PADDING) {
      // Flip above the anchor
      const ah = anchorHeight?.value ?? 0
      top = pos.y - gap * 2 - ah - panelHeight
      flipped = true
      if (top < EDGE_PADDING) top = EDGE_PADDING
    } else if (top < EDGE_PADDING) {
      top = EDGE_PADDING
    }

    return { left, top, flipped }
  })
}
