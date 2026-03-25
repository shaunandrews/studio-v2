<script setup lang="ts">
import { computed } from 'vue'
import SitePageThumb from '@/components/composites/SitePageThumb.vue'
import SiteSectionThumb from '@/components/composites/SiteSectionThumb.vue'
import { useSiteDocument } from '@/data/useSiteDocument'
import { renderSite, renderSection } from '@/data/site-renderer'
import { sites as siteRegistry } from '@/data/sites/index'
import { deriveCanvasParts } from '@/data/useSiteTemplates'
import type { CanvasPart } from '@/data/useSiteTemplates'
import type { MockLayout } from '@/data/types'
import type { SiteContentTemplate } from '@/data/site-types'
import type { SiteTheme } from '@/data/useSiteTemplates'

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

const theme = computed<SiteTheme | null>(() => {
  return siteFiles.value?.config.theme ?? null
})

const parts = computed<CanvasPart[]>(() => {
  if (siteFiles.value) return deriveCanvasParts(siteFiles.value.config)
  return []
})

/** WP templates from the content model */
const wpTemplates = computed<SiteContentTemplate[]>(() => {
  return siteContent.value?.wpTemplates ?? []
})

/**
 * Templates fall into two categories:
 * - Structural shells (page, single, front-page, index): header + placeholder content + footer
 * - Bespoke templates (404, search, archive): header + real rendered content + footer
 */
const bespokeTemplates = new Set(['404', 'search', 'archive', 'archive-product', 'archive-docs'])

/** Placeholder blocks for structural shell templates */
function getShellPlaceholder(slug: string): string {
  if (slug === 'front-page') {
    return `
      <div class="tpl-hero">
        <div class="tpl-block tpl-block--hero-title"></div>
        <div class="tpl-block tpl-block--hero-sub"></div>
        <div class="tpl-block tpl-block--btn"></div>
      </div>
      <div class="tpl-features">
        <div class="tpl-feature-card"></div>
        <div class="tpl-feature-card"></div>
        <div class="tpl-feature-card"></div>
      </div>`
  }
  if (slug === 'index') {
    return `
      <div class="tpl-content">
        <div class="tpl-post-list">
          <div class="tpl-post-item"><div class="tpl-block tpl-block--post-title"></div><div class="tpl-block tpl-block--meta"></div><div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div></div>
          <div class="tpl-post-item"><div class="tpl-block tpl-block--post-title"></div><div class="tpl-block tpl-block--meta"></div><div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div></div>
          <div class="tpl-post-item"><div class="tpl-block tpl-block--post-title"></div><div class="tpl-block tpl-block--meta"></div><div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div></div>
        </div>
      </div>`
  }
  if (slug.startsWith('single')) {
    return `
      <div class="tpl-content">
        <div class="tpl-block tpl-block--title-lg"></div>
        <div class="tpl-block tpl-block--meta"></div>
        <div class="tpl-block tpl-block--featured-img"></div>
        <div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div>
        <div class="tpl-block tpl-block--gap"></div>
        <div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div>
      </div>`
  }
  // page, page-*, and any other shell
  return `
    <div class="tpl-content">
      <div class="tpl-block tpl-block--title"></div>
      <div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div>
      <div class="tpl-block tpl-block--gap"></div>
      <div class="tpl-block tpl-block--line"></div><div class="tpl-block tpl-block--line-short"></div>
    </div>`
}

/** Real rendered content for bespoke templates */
function getBespokeContent(slug: string, siteName: string): string {
  if (slug === '404') {
    return `
      <div class="bespoke-404">
        <span class="bespoke-404__code">404</span>
        <h1 class="bespoke-404__title">Page not found</h1>
        <p class="bespoke-404__msg">The page you're looking for doesn't exist or has been moved.</p>
        <a class="bespoke-404__link" href="#">Back to home</a>
      </div>`
  }
  if (slug === 'search') {
    return `
      <div class="bespoke-search">
        <h1 class="bespoke-search__title">Search results</h1>
        <div class="bespoke-search__input-wrap">
          <input class="bespoke-search__input" type="text" value="example query" readonly />
        </div>
        <p class="bespoke-search__count">3 results found</p>
        <div class="bespoke-search__results">
          <div class="bespoke-search__result">
            <h3 class="bespoke-search__result-title">Getting Started Guide</h3>
            <p class="bespoke-search__result-excerpt">An introduction to the tools and workflows you'll use every day…</p>
          </div>
          <div class="bespoke-search__result">
            <h3 class="bespoke-search__result-title">Frequently Asked Questions</h3>
            <p class="bespoke-search__result-excerpt">Answers to the most common questions from our community…</p>
          </div>
          <div class="bespoke-search__result">
            <h3 class="bespoke-search__result-title">Recent Updates</h3>
            <p class="bespoke-search__result-excerpt">A summary of everything that's new this month…</p>
          </div>
        </div>
      </div>`
  }
  // archive, archive-product, archive-docs
  return `
    <div class="bespoke-archive">
      <h1 class="bespoke-archive__title">Archive</h1>
      <div class="bespoke-archive__filters">
        <span class="bespoke-archive__filter is-active">All</span>
        <span class="bespoke-archive__filter">Category</span>
        <span class="bespoke-archive__filter">Recent</span>
      </div>
      <div class="bespoke-archive__grid">
        <div class="bespoke-archive__card"><div class="bespoke-archive__card-img"></div><span class="bespoke-archive__card-title">First Post Title</span><span class="bespoke-archive__card-meta">Jan 15, 2026</span></div>
        <div class="bespoke-archive__card"><div class="bespoke-archive__card-img"></div><span class="bespoke-archive__card-title">Second Post Title</span><span class="bespoke-archive__card-meta">Jan 10, 2026</span></div>
        <div class="bespoke-archive__card"><div class="bespoke-archive__card-img"></div><span class="bespoke-archive__card-title">Third Post Title</span><span class="bespoke-archive__card-meta">Jan 5, 2026</span></div>
        <div class="bespoke-archive__card"><div class="bespoke-archive__card-img"></div><span class="bespoke-archive__card-title">Fourth Post Title</span><span class="bespoke-archive__card-meta">Dec 28, 2025</span></div>
        <div class="bespoke-archive__card"><div class="bespoke-archive__card-img"></div><span class="bespoke-archive__card-title">Fifth Post Title</span><span class="bespoke-archive__card-meta">Dec 20, 2025</span></div>
        <div class="bespoke-archive__card"><div class="bespoke-archive__card-img"></div><span class="bespoke-archive__card-title">Sixth Post Title</span><span class="bespoke-archive__card-meta">Dec 15, 2025</span></div>
      </div>
    </div>`
}

/** Shared styles for template rendering */
const tplStyles = `
  body { margin: 0; background: var(--bg, #fff); color: var(--text, #1a1a1a); font-family: var(--font-body, 'Inter', sans-serif); }

  /* ── Shell placeholder blocks ── */
  .tpl-block { background: var(--border, rgba(0,0,0,0.06)); border-radius: 4px; }
  .tpl-content { max-width: var(--content, 640px); margin: 0 auto; padding: 48px 24px; display: flex; flex-direction: column; gap: 14px; }
  .tpl-hero { text-align: center; padding: 80px 24px 60px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .tpl-block--title { height: 22px; width: 40%; }
  .tpl-block--title-lg { height: 30px; width: 65%; }
  .tpl-block--hero-title { height: 36px; width: 50%; }
  .tpl-block--hero-sub { height: 12px; width: 35%; opacity: 0.6; }
  .tpl-block--line { height: 10px; width: 100%; }
  .tpl-block--line-short { height: 10px; width: 70%; }
  .tpl-block--gap { height: 12px; background: none; }
  .tpl-block--meta { height: 8px; width: 25%; opacity: 0.5; }
  .tpl-block--post-title { height: 16px; width: 60%; }
  .tpl-block--btn { height: 32px; width: 120px; border-radius: 6px; background: var(--accent, #1a1a1a); opacity: 0.15; }
  .tpl-block--featured-img { height: 180px; width: 100%; border-radius: 6px; }
  .tpl-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: var(--wide, 800px); margin: 0 auto; padding: 0 24px 60px; }
  .tpl-feature-card { height: 100px; border-radius: 8px; background: var(--surface, #fafafa); border: 1px solid var(--border, rgba(0,0,0,0.06)); }
  .tpl-post-list { display: flex; flex-direction: column; }
  .tpl-post-item { display: flex; flex-direction: column; gap: 10px; padding: 24px 0; border-bottom: 1px solid var(--border, rgba(0,0,0,0.06)); }

  /* ── Bespoke: 404 ── */
  .bespoke-404 { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 24px; text-align: center; }
  .bespoke-404__code { font-family: var(--font-heading, var(--font-body, sans-serif)); font-size: 120px; font-weight: 700; line-height: 1; color: var(--text, #1a1a1a); opacity: 0.08; }
  .bespoke-404__title { font-family: var(--font-heading, var(--font-body, sans-serif)); font-size: 28px; font-weight: 600; margin: -20px 0 0; color: var(--text, #1a1a1a); }
  .bespoke-404__msg { font-size: 15px; color: var(--muted, #999); margin: 8px 0 0; max-width: 360px; line-height: 1.5; }
  .bespoke-404__link { display: inline-block; margin-top: 24px; padding: 10px 24px; background: var(--accent, #1a1a1a); color: var(--bg, #fff); border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none; }

  /* ── Bespoke: Search ── */
  .bespoke-search { max-width: var(--content, 640px); margin: 0 auto; padding: 48px 24px; }
  .bespoke-search__title { font-family: var(--font-heading, var(--font-body, sans-serif)); font-size: 24px; font-weight: 600; margin: 0 0 20px; }
  .bespoke-search__input-wrap { margin-bottom: 16px; }
  .bespoke-search__input { width: 100%; box-sizing: border-box; padding: 12px 16px; font-size: 15px; font-family: var(--font-body, sans-serif); border: 2px solid var(--border, rgba(0,0,0,0.1)); border-radius: 8px; background: var(--surface, #fafafa); color: var(--text, #1a1a1a); outline: none; }
  .bespoke-search__count { font-size: 13px; color: var(--muted, #999); margin: 0 0 8px; }
  .bespoke-search__results { display: flex; flex-direction: column; }
  .bespoke-search__result { padding: 20px 0; border-bottom: 1px solid var(--border, rgba(0,0,0,0.06)); }
  .bespoke-search__result-title { font-family: var(--font-heading, var(--font-body, sans-serif)); font-size: 17px; font-weight: 600; margin: 0 0 6px; color: var(--accent, #1a1a1a); }
  .bespoke-search__result-excerpt { font-size: 14px; color: var(--muted, #999); margin: 0; line-height: 1.5; }

  /* ── Bespoke: Archive ── */
  .bespoke-archive { max-width: var(--wide, 800px); margin: 0 auto; padding: 48px 24px; }
  .bespoke-archive__title { font-family: var(--font-heading, var(--font-body, sans-serif)); font-size: 24px; font-weight: 600; margin: 0 0 20px; }
  .bespoke-archive__filters { display: flex; gap: 8px; margin-bottom: 24px; }
  .bespoke-archive__filter { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; background: var(--surface, #fafafa); color: var(--muted, #999); border: 1px solid var(--border, rgba(0,0,0,0.06)); }
  .bespoke-archive__filter.is-active { background: var(--accent, #1a1a1a); color: var(--bg, #fff); border-color: transparent; }
  .bespoke-archive__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .bespoke-archive__card { display: flex; flex-direction: column; gap: 10px; }
  .bespoke-archive__card-img { aspect-ratio: 4 / 3; border-radius: 6px; background: var(--surface, #fafafa); border: 1px solid var(--border, rgba(0,0,0,0.06)); }
  .bespoke-archive__card-title { font-size: 15px; font-weight: 600; color: var(--text, #1a1a1a); }
  .bespoke-archive__card-meta { font-size: 12px; color: var(--muted, #999); }
`

/** Render template HTML: shells get placeholders, bespoke templates get real content */
function getTemplateHtml(tpl: SiteContentTemplate): string {
  if (!siteContent.value) return ''
  const site = siteContent.value
  const chunks: string[] = []
  chunks.push('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">')
  if (site.theme.fonts.length > 0) {
    const fontParams = site.theme.fonts.map(f => `family=${encodeURIComponent(f)}`).join('&')
    chunks.push(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontParams}&display=swap">`)
  }
  const rootVars = Object.entries(site.theme.variables).map(([k, v]) => `${k}: ${v};`).join('\n')
  chunks.push(`<style>:root { ${rootVars} }</style>`)

  // Collect CSS for shared sections
  for (const secId of tpl.sections) {
    const sec = site.sections[secId]
    if (sec?.shared && sec.css) chunks.push(`<style>${sec.css}</style>`)
  }

  chunks.push(`<style>${tplStyles}</style>`)
  chunks.push('</head><body>')

  const isBespoke = bespokeTemplates.has(tpl.slug)

  // Render sections in order — shared parts render their HTML, non-shared sections get replaced with template content
  let hasContent = false
  for (const secId of tpl.sections) {
    const sec = site.sections[secId]
    if (sec?.shared) {
      chunks.push(`<div data-section="${secId}" style="display:contents">${sec.html}</div>`)
    } else if (!hasContent) {
      hasContent = true
      chunks.push(isBespoke ? getBespokeContent(tpl.slug, site.name) : getShellPlaceholder(tpl.slug))
    }
  }

  chunks.push('</body></html>')
  return chunks.join('\n')
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
          class="canvas-node"
          :class="{ 'canvas-node--stack': tpl.renders.length > 1, 'is-selected': selectedNodeId === `tpl-${ti}` }"
          :data-node-id="`tpl-${ti}`"
          @click.stop="emit('select', `tpl-${ti}`)"
        >
          <div v-if="tpl.renders.length > 1" class="stack-cards">
            <div class="stack-card" />
            <div class="stack-card" />
          </div>
          <SiteSectionThumb v-if="siteContent" :html="getTemplateHtml(tpl)" />
          <span v-if="tpl.renders.length > 1" class="canvas-badge" :style="{ transform: badgeTransform }">{{ tpl.renders.length }}</span>
          <span class="canvas-label" :class="{ 'is-selected': selectedNodeId === `tpl-${ti}` }" :style="{ transform: labelScale }">{{ tpl.label }}</span>
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
          class="canvas-node"
          :class="{ 'is-selected': selectedNodeId === `tpart-${pi}` }"
          :data-node-id="`tpart-${pi}`"
          @click.stop="emit('select', `tpart-${pi}`)"
        >
          <span class="canvas-label" :class="{ 'is-selected': selectedNodeId === `tpart-${pi}` }" :style="{ transform: labelScale }">{{ part.label }}</span>
          <SiteSectionThumb v-if="siteContent" :html="getSectionHtml(part.id)" />
        </div>
      </div>
    </div>

    <!-- Styles (theme.json) group -->
    <div v-if="theme" class="theme-group">
      <span class="theme-group-label" :style="{ transform: labelScale }">Styles</span>
      <div class="styles-card">
        <!-- Colors -->
        <div class="styles-section">
          <span class="styles-section-label">Colors</span>
          <div class="color-grid">
            <div
              v-for="(value, name) in theme.colors"
              :key="name"
              class="color-item"
            >
              <div class="color-swatch" :style="{ background: value }" />
              <span class="color-name">{{ name }}</span>
              <span class="color-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Typography: fonts + sizes + weights + line heights -->
        <div class="styles-section">
          <span class="styles-section-label">Typography</span>

          <!-- Font families -->
          <div class="font-list">
            <div
              v-for="(value, role) in theme.fonts"
              :key="role"
              class="font-item"
            >
              <span class="font-role">{{ role }}</span>
              <span class="font-specimen" :style="{ fontFamily: value }">Aa</span>
              <span class="font-family">{{ value.split(',')[0].replace(/'/g, '') }}</span>
            </div>
          </div>

          <!-- Font sizes -->
          <div v-if="theme.fontSizes" class="type-scale">
            <span class="styles-sub-label">Scale</span>
            <div class="type-scale-items">
              <div
                v-for="(value, name) in theme.fontSizes"
                :key="name"
                class="type-scale-item"
              >
                <span class="type-scale-sample" :style="{ fontSize: value }">Ag</span>
                <span class="type-scale-name">{{ name }}</span>
                <span class="type-scale-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <!-- Font weights -->
          <div v-if="theme.fontWeights" class="token-row-group">
            <span class="styles-sub-label">Weights</span>
            <div class="token-rows">
              <div
                v-for="(value, name) in theme.fontWeights"
                :key="name"
                class="token-row"
              >
                <span class="token-row-sample" :style="{ fontWeight: value }">Aa</span>
                <span class="token-row-name">{{ name }}</span>
                <span class="token-row-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <!-- Line heights -->
          <div v-if="theme.lineHeights" class="token-row-group">
            <span class="styles-sub-label">Line height</span>
            <div class="token-rows">
              <div
                v-for="(value, name) in theme.lineHeights"
                :key="name"
                class="token-row"
              >
                <span class="token-row-leading" :style="{ lineHeight: String(value) }">The quick brown<br>fox jumps over</span>
                <span class="token-row-name">{{ name }}</span>
                <span class="token-row-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Spacing scale -->
        <div v-if="theme.spacing" class="styles-section">
          <span class="styles-section-label">Spacing</span>
          <div class="spacing-scale">
            <div
              v-for="(value, name) in theme.spacing"
              :key="name"
              class="spacing-scale-item"
            >
              <span class="spacing-scale-name">{{ name }}</span>
              <div class="spacing-scale-block" :style="{ width: value, height: value }" />
              <span class="spacing-scale-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Border radii -->
        <div v-if="theme.radii" class="styles-section">
          <span class="styles-section-label">Radius</span>
          <div class="radii-grid">
            <div
              v-for="(value, name) in theme.radii"
              :key="name"
              class="radii-item"
            >
              <div class="radii-swatch" :style="{ borderRadius: value }" />
              <span class="radii-name">{{ name }}</span>
              <span class="radii-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Layout widths -->
        <div v-if="theme.layout" class="styles-section">
          <span class="styles-section-label">Layout</span>
          <div class="layout-list">
            <div
              v-for="(value, name) in theme.layout"
              :key="name"
              class="layout-item"
            >
              <span class="layout-name">{{ name }}</span>
              <div class="layout-bar" :style="{ width: `${(parseFloat(value) / 1200) * 100}%` }" />
              <span class="layout-value">{{ value }}</span>
            </div>
          </div>
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

/* ── Node (duplicated from CanvasScreen — scoped styles don't inherit) ── */

.canvas-node {
  position: relative;
  cursor: pointer;
}

.canvas-node .page-thumb {
  transition: outline-color var(--duration-fast) var(--ease-default);
  outline: calc(1.5px / var(--zoom, 1)) solid transparent;
  outline-offset: calc(2px / var(--zoom, 1));
}

.canvas-node.is-selected .page-thumb {
  outline-color: var(--color-frame-selected);
}

.canvas-label {
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

.canvas-label.is-selected {
  color: var(--color-frame-selected);
}

.canvas-node--stack {
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

.canvas-badge {
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

/* ── Styles card ── */

.styles-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-l);
  background: var(--color-frame-bg);
  border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border);
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
  width: 320px;
}

.styles-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.styles-section-label {
  font-size: var(--font-size-xxs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.styles-sub-label {
  font-size: 9px;
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-block-start: var(--space-xs);
}

/* Colors */

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-s);
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-s);
  border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border);
}

.color-name {
  font-size: var(--font-size-xxs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  text-transform: capitalize;
}

.color-value {
  font-size: 9px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
  line-height: 1;
}

/* Typography: font families */

.font-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.font-item {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: var(--space-s);
  align-items: baseline;
}

.font-role {
  grid-column: 1;
  grid-row: 1;
  font-size: var(--font-size-xxs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  text-transform: capitalize;
}

.font-specimen {
  grid-column: 2;
  grid-row: 1 / 3;
  font-size: 32px;
  line-height: 1;
  color: var(--color-frame-fg);
  justify-self: end;
}

.font-family {
  grid-column: 1;
  grid-row: 2;
  font-size: 9px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
}

/* Typography: type scale */

.type-scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.type-scale-items {
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
}

.type-scale-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
}

.type-scale-sample {
  color: var(--color-frame-fg);
  line-height: 1.1;
}

.type-scale-name {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.type-scale-value {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
  opacity: 0.7;
}

/* Typography: weights */

.token-row-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.token-rows {
  display: flex;
  gap: var(--space-m);
}

.token-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.token-row-sample {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  line-height: 1;
}

.token-row-name {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.token-row-value {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
  opacity: 0.7;
}

/* Typography: line heights */

.token-row-leading {
  font-size: var(--font-size-xxs);
  color: var(--color-frame-fg);
  background: var(--color-frame-fill);
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
}

/* Spacing scale */

.spacing-scale {
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
}

.spacing-scale-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
}

.spacing-scale-block {
  background: var(--color-frame-fg);
  border-radius: var(--radius-s);
  opacity: 0.15;
  min-width: 4px;
  min-height: 4px;
}

.spacing-scale-name {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.spacing-scale-value {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
  opacity: 0.7;
}

/* Border radii */

.radii-grid {
  display: flex;
  gap: var(--space-s);
}

.radii-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
}

.radii-swatch {
  width: 40px;
  height: 40px;
  background: var(--color-frame-fill);
  border: calc(1.5px / var(--zoom, 1)) solid var(--color-frame-fg-muted);
  opacity: 0.6;
}

.radii-name {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.radii-value {
  font-size: 8px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
  opacity: 0.7;
}

/* Layout widths */

.layout-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.layout-item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: var(--space-xs);
  align-items: center;
}

.layout-name {
  font-size: var(--font-size-xxs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  text-transform: capitalize;
}

.layout-bar {
  height: var(--space-xs);
  background: var(--color-frame-fg);
  border-radius: var(--radius-s);
  opacity: 0.15;
  min-width: var(--space-xs);
}

.layout-value {
  font-size: 9px;
  color: var(--color-frame-fg-muted);
  font-family: var(--font-mono);
}

@media (prefers-color-scheme: dark) {
  .page-thumb {
    background: #2c2c2c;
  }

  .stack-card { background: var(--color-frame-bg); }
}
</style>
