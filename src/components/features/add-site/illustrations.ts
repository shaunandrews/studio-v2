import { h, defineComponent } from 'vue'

const SIZE = 120

function svg(children: ReturnType<typeof h>[]) {
  return h('svg', {
    width: SIZE,
    height: SIZE,
    viewBox: '0 0 120 120',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }, children)
}

/**
 * Blank site — empty browser window with a cursor blinking
 */
export const IllustrationBlank = defineComponent({
  name: 'IllustrationBlank',
  setup() {
    return () => svg([
      // Browser chrome bar
      h('rect', { x: 20, y: 24, width: 80, height: 72, rx: 8, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      // Title bar
      h('line', { x1: 20, y1: 38, x2: 100, y2: 38, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.15 }),
      // Three dots
      h('circle', { cx: 30, cy: 31, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('circle', { cx: 37, cy: 31, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('circle', { cx: 44, cy: 31, r: 2, fill: 'currentColor', opacity: 0.25 }),
      // Cursor line blinking
      h('line', { x1: 36, y1: 52, x2: 36, y2: 64, stroke: 'var(--color-chrome-theme)', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 }),
      h('animateTransform'),
    ])
  },
})

/**
 * Blueprint — grid of layout blocks
 */
export const IllustrationBlueprint = defineComponent({
  name: 'IllustrationBlueprint',
  setup() {
    return () => svg([
      // Outer frame
      h('rect', { x: 20, y: 24, width: 80, height: 72, rx: 8, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      // Header block
      h('rect', { x: 28, y: 32, width: 64, height: 10, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.25 }),
      // Two column blocks
      h('rect', { x: 28, y: 48, width: 28, height: 20, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.15 }),
      h('rect', { x: 64, y: 48, width: 28, height: 20, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.15 }),
      // Footer block
      h('rect', { x: 28, y: 74, width: 64, height: 14, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.1 }),
    ])
  },
})

/**
 * Pull existing — globe with latitude/longitude grid lines
 */
export const IllustrationPull = defineComponent({
  name: 'IllustrationPull',
  setup() {
    return () => svg([
      // Globe circle (oversized to match perceived size of square illustrations)
      h('circle', { cx: 60, cy: 56, r: 38, stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
      // Longitude ellipses
      h('ellipse', { cx: 60, cy: 56, rx: 15, ry: 38, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.15 }),
      h('ellipse', { cx: 60, cy: 56, rx: 30, ry: 38, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.1 }),
      // Equator
      h('line', { x1: 22, y1: 56, x2: 98, y2: 56, stroke: 'currentColor', 'stroke-width': 1, opacity: 0.15 }),
      // Latitude lines
      h('ellipse', { cx: 60, cy: 40, rx: 33, ry: 8, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.12 }),
      h('ellipse', { cx: 60, cy: 72, rx: 33, ry: 8, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.12 }),
      // Small accent dot — "you are here"
      h('circle', { cx: 75, cy: 42, r: 3, fill: 'var(--color-chrome-theme)', opacity: 0.6 }),
    ])
  },
})

/**
 * Import backup — isometric open box viewed from front-above
 *
 * Geometry: isometric hexagon with front corner at bottom.
 * Floor diamond at y+30, walls go up 30px.
 * Vertices:
 *   A'(28,44) ── D'(60,30) ── C'(92,44)   ← wall tops / opening rim
 *       │                          │
 *   A (28,74) ── B (60,88) ── C (92,74)   ← wall bottoms
 *                  front corner
 */
export const IllustrationImport = defineComponent({
  name: 'IllustrationImport',
  setup() {
    return () => svg([
      // Box outline (hexagon: two walls + bottom edges)
      h('path', {
        d: 'M28 44 L28 74 L60 88 L92 74 L92 44',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        fill: 'none',
        opacity: 0.3,
        'stroke-linejoin': 'round',
      }),
      // Front corner vertical edge
      h('line', { x1: 60, y1: 88, x2: 60, y2: 58, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      // Top rim to front corner (shows opening shape)
      h('line', { x1: 28, y1: 44, x2: 60, y2: 58, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      h('line', { x1: 92, y1: 44, x2: 60, y2: 58, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      // Back edge of opening
      h('line', { x1: 28, y1: 44, x2: 60, y2: 30, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
      h('line', { x1: 92, y1: 44, x2: 60, y2: 30, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
      // Inside fill (looking down into the box)
      h('path', {
        d: 'M28 44 L60 30 L92 44 L60 58 Z',
        fill: 'var(--color-chrome-theme)',
        'fill-opacity': 0.06,
        stroke: 'none',
      }),
      // Back-left flap (folded open backward)
      h('path', {
        d: 'M28 44 L20 26 L52 12 L60 30 Z',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        fill: 'var(--color-chrome-theme)',
        'fill-opacity': 0.04,
        opacity: 0.25,
        'stroke-linejoin': 'round',
      }),
      // Back-right flap (folded open backward)
      h('path', {
        d: 'M92 44 L100 26 L68 12 L60 30 Z',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        fill: 'var(--color-chrome-theme)',
        'fill-opacity': 0.04,
        opacity: 0.25,
        'stroke-linejoin': 'round',
      }),
    ])
  },
})

export const illustrations = {
  blank: IllustrationBlank,
  blueprint: IllustrationBlueprint,
  pull: IllustrationPull,
  import: IllustrationImport,
} as const
