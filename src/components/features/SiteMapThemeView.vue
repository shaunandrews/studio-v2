<script setup lang="ts">
import { computed } from 'vue'
import SitePageThumb from '@/components/composites/SitePageThumb.vue'
import SiteSectionThumb from '@/components/composites/SiteSectionThumb.vue'
import { useSiteDocument } from '@/data/useSiteDocument'
import { renderSite, renderSection } from '@/data/site-renderer'
import { sites as siteRegistry } from '@/data/sites/index'
import { deriveSiteMapParts } from '@/data/useSiteTemplates'
import type { SiteMapPart } from '@/data/useSiteTemplates'
import type { MockLayout } from '@/data/types'
import type { SiteContentTemplate } from '@/data/site-types'

const props = defineProps<{
  siteId: string
  mockLayout: MockLayout
  selectedNodeId: string | null
  labelScale: string
  badgeTransform: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { getContent } = useSiteDocument()
const siteContent = computed(() => getContent(props.siteId).value)
const siteFiles = computed(() => siteRegistry[props.mockLayout] ?? null)

const parts = computed<SiteMapPart[]>(() => {
  if (siteFiles.value) return deriveSiteMapParts(siteFiles.value.config)
  return []
})

/** WP templates from the content model */
const wpTemplates = computed<SiteContentTemplate[]>(() => {
  return siteContent.value?.wpTemplates ?? []
})

function getTemplateHtml(tpl: SiteContentTemplate): string {
  if (!siteContent.value) return ''
  // Use the first rendered page to show what this template looks like
  const firstSlug = tpl.renders[0]
  if (firstSlug) {
    const resolvedSlug = firstSlug.includes(':') ? firstSlug.replace(/\/:[^/]+$/, '') || '/' : firstSlug
    return renderSite(siteContent.value, resolvedSlug)
  }
  // For templates with no pages (404, search) — render the template skeleton directly
  return renderTemplateSkeleton(tpl)
}

function renderTemplateSkeleton(tpl: SiteContentTemplate): string {
  if (!siteContent.value) return ''
  // Build a minimal page from the template's section list
  const site = siteContent.value
  const parts: string[] = []
  parts.push('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">')
  if (site.theme.fonts.length > 0) {
    const fontParams = site.theme.fonts.map(f => `family=${encodeURIComponent(f)}`).join('&')
    parts.push(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontParams}&display=swap">`)
  }
  const rootVars = Object.entries(site.theme.variables).map(([k, v]) => `${k}: ${v};`).join('\n')
  parts.push(`<style>:root { ${rootVars} }</style>`)
  for (const secId of tpl.sections) {
    const sec = site.sections[secId]
    if (sec?.css) parts.push(`<style>${sec.css}</style>`)
  }
  parts.push('<style>body { margin: 0; background: var(--bg, #fff); }</style>')
  parts.push('</head><body>')
  for (const secId of tpl.sections) {
    const sec = site.sections[secId]
    if (sec) parts.push(`<div data-section="${secId}" style="display:contents">${sec.html}</div>`)
  }
  parts.push('</body></html>')
  return parts.join('\n')
}

function getSectionHtml(sectionId: string): string {
  if (!siteContent.value) return ''
  return renderSection(siteContent.value, sectionId)
}
</script>

<template>
  <div class="theme-view">
    <!-- Templates group -->
    <div class="theme-group">
      <span class="theme-group-label" :style="{ transform: labelScale }">Templates</span>
      <div class="theme-group-nodes">
        <div
          v-for="(tpl, ti) in wpTemplates"
          :key="tpl.slug"
          class="sitemap-node"
          :class="{ 'sitemap-node--stack': tpl.renders.length > 1, 'is-selected': selectedNodeId === `tpl-${ti}` }"
          :data-node-id="`tpl-${ti}`"
          @click.stop="emit('select', `tpl-${ti}`)"
        >
          <div v-if="tpl.renders.length > 1" class="stack-cards">
            <div class="stack-card" />
            <div class="stack-card" />
          </div>
          <div class="page-thumb">
            <SitePageThumb v-if="siteContent" :html="getTemplateHtml(tpl)" />
          </div>
          <span v-if="tpl.renders.length > 1" class="sitemap-badge" :style="{ transform: badgeTransform }">{{ tpl.renders.length }}</span>
          <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === `tpl-${ti}` }" :style="{ transform: labelScale }">{{ tpl.label }}</span>
        </div>
      </div>
    </div>

    <!-- Template Parts group -->
    <div v-if="parts.length" class="theme-group">
      <span class="theme-group-label" :style="{ transform: labelScale }">Template Parts</span>
      <div class="theme-group-nodes">
        <div
          v-for="(part, pi) in parts"
          :key="part.id"
          class="sitemap-node"
          :class="{ 'is-selected': selectedNodeId === `tpart-${pi}` }"
          :data-node-id="`tpart-${pi}`"
          @click.stop="emit('select', `tpart-${pi}`)"
        >
          <span class="sitemap-label" :class="{ 'is-selected': selectedNodeId === `tpart-${pi}` }" :style="{ transform: labelScale }">{{ part.label }}</span>
          <SiteSectionThumb v-if="siteContent" :html="getSectionHtml(part.id)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-view {
  display: flex;
  gap: 120px;
  align-items: flex-start;
}

.theme-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.theme-group-label {
  transform-origin: bottom center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-block-end: var(--space-m);
  white-space: nowrap;
}

.theme-group-nodes {
  display: flex;
  gap: var(--space-l);
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Node (duplicated from SiteMapScreen — scoped styles don't inherit) ── */

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

.page-thumb {
  width: 160px;
  aspect-ratio: 3 / 4;
  border-radius: calc(0.5px / var(--zoom, 1));
  overflow: hidden;
  background: white;
  position: relative;
  z-index: 1;
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
}

@media (prefers-color-scheme: dark) {
  .page-thumb {
    background: #2c2c2c;
  }

  .stack-card { background: var(--color-frame-bg); }
}
</style>
