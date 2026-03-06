<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon: any
  size?: number
}>()

const attrMap: Record<string, string> = {
  fillRule: 'fill-rule',
  clipRule: 'clip-rule',
  clipPath: 'clip-path',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
}

// Resolve a React element (possibly with function type) to a plain {type, props} object
function resolve(el: any): any {
  if (!el || typeof el === 'string') return el
  if (Array.isArray(el)) return el.map(resolve)
  // If type is a function (WP primitive component), call it to get the real element
  if (typeof el.type === 'function') {
    return resolve(el.type(el.props))
  }
  return el
}

function toSvg(el: any): string {
  if (!el) return ''
  if (typeof el === 'string') return el
  if (Array.isArray(el)) return el.map(toSvg).join('')

  const resolved = resolve(el)
  if (!resolved || typeof resolved === 'string') return resolved || ''
  if (Array.isArray(resolved)) return resolved.map(toSvg).join('')

  const tag = resolved.type
  if (typeof tag !== 'string') return ''

  let attrs = ''
  for (const [key, val] of Object.entries(resolved.props || {})) {
    if (key === 'children') continue
    const name = attrMap[key] || key
    attrs += ` ${name}="${val}"`
  }

  const children = resolved.props?.children ? toSvg(resolved.props.children) : ''
  return `<${tag}${attrs}>${children}</${tag}>`
}

const svgInner = computed(() => {
  const children = props.icon?.props?.children
  return toSvg(children)
})
const viewBox = computed(() => props.icon?.props?.viewBox || '0 0 24 24')
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    :width="size || 24"
    :height="size || 24"
    v-html="svgInner"
  />
</template>

<style scoped>
svg {
  fill: currentColor;
  flex-shrink: 0;
}
</style>
