import { h, defineComponent } from 'vue'

function svg(viewBox: string, children: ReturnType<typeof h>[]) {
  const [, , w, hh] = viewBox.split(' ').map(Number)
  return h('svg', {
    width: w,
    height: hh,
    viewBox,
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }, children)
}

// All content offset by 1px from edges to avoid stroke clipping.
// viewBox includes 1px padding on all sides.

/**
 * Empty site — empty browser window with a cursor blinking
 */
export const IllustrationEmpty = defineComponent({
  name: 'IllustrationEmpty',
  setup() {
    return () => svg('-1 -1 82 74', [
      h('rect', { x: 0, y: 0, width: 80, height: 72, rx: 8, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      h('line', { x1: 0, y1: 14, x2: 80, y2: 14, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.15 }),
      h('circle', { cx: 10, cy: 7, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('circle', { cx: 17, cy: 7, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('circle', { cx: 24, cy: 7, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('line', { x1: 16, y1: 28, x2: 16, y2: 40, stroke: 'var(--color-chrome-theme)', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 }),
    ])
  },
})

/**
 * Blueprint — grid of layout blocks
 */
export const IllustrationBlueprint = defineComponent({
  name: 'IllustrationBlueprint',
  setup() {
    return () => svg('-1 -1 82 74', [
      h('rect', { x: 0, y: 0, width: 80, height: 72, rx: 8, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      h('rect', { x: 8, y: 8, width: 64, height: 10, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.25 }),
      h('rect', { x: 8, y: 24, width: 28, height: 20, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.15 }),
      h('rect', { x: 44, y: 24, width: 28, height: 20, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.15 }),
      h('rect', { x: 8, y: 50, width: 64, height: 14, rx: 3, fill: 'var(--color-chrome-theme)', opacity: 0.1 }),
    ])
  },
})

/**
 * Pull existing — globe with latitude/longitude grid lines
 */
export const IllustrationPull = defineComponent({
  name: 'IllustrationPull',
  setup() {
    return () => svg('-1 -1 80 80', [
      h('circle', { cx: 39, cy: 39, r: 38, stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
      h('ellipse', { cx: 39, cy: 39, rx: 15, ry: 38, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.15 }),
      h('ellipse', { cx: 39, cy: 39, rx: 30, ry: 38, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.1 }),
      h('line', { x1: 1, y1: 39, x2: 77, y2: 39, stroke: 'currentColor', 'stroke-width': 1, opacity: 0.15 }),
      h('ellipse', { cx: 39, cy: 23, rx: 33, ry: 8, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.12 }),
      h('ellipse', { cx: 39, cy: 55, rx: 33, ry: 8, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.12 }),
      h('circle', { cx: 54, cy: 25, r: 3, fill: 'var(--color-chrome-theme)', opacity: 0.6 }),
    ])
  },
})

/**
 * Import backup — closed isometric cube with a seal line on top
 */
export const IllustrationImport = defineComponent({
  name: 'IllustrationImport',
  setup() {
    return () => svg('-1 -1 84 84', [
      h('path', {
        d: 'M1 21 L1 61 L41 81 L81 61 L81 21 L41 1 Z',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        fill: 'none',
        opacity: 0.3,
        'stroke-linejoin': 'round',
      }),
      h('line', { x1: 41, y1: 81, x2: 41, y2: 41, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.3 }),
      h('line', { x1: 1, y1: 21, x2: 41, y2: 41, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.25 }),
      h('line', { x1: 81, y1: 21, x2: 41, y2: 41, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.25 }),
      h('path', {
        d: 'M1 21 L41 1 L81 21 L41 41 Z',
        fill: 'var(--color-chrome-theme)',
        'fill-opacity': 0.06,
        stroke: 'none',
      }),
      h('line', { x1: 21, y1: 11, x2: 61, y2: 31, stroke: 'var(--color-chrome-theme)', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.4 }),
    ])
  },
})

export const illustrations = {
  empty: IllustrationEmpty,
  blueprint: IllustrationBlueprint,
  pull: IllustrationPull,
  import: IllustrationImport,
} as const
