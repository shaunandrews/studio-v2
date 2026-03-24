<script setup lang="ts">
import { computed, ref } from 'vue'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import type { MergeConflict, MergeResult, SiteContentTheme } from '@/data/site-types'

const props = defineProps<{
  open: boolean
  result: MergeResult | null
  theme?: SiteContentTheme
}>()

const emit = defineEmits<{
  close: []
  resolve: [result: MergeResult]
}>()

// Local copy of conflicts with resolutions
const resolutions = ref<Record<string, 'main' | 'task'>>({})

const conflicts = computed(() => props.result?.conflicts ?? [])

const resolvedCount = computed(() =>
  conflicts.value.filter(c => resolutions.value[c.id]).length
)

const allResolved = computed(() =>
  conflicts.value.length > 0 && resolvedCount.value === conflicts.value.length
)

function resolve(conflictId: string, side: 'main' | 'task') {
  resolutions.value = { ...resolutions.value, [conflictId]: side }
}

function getResolution(conflictId: string): 'main' | 'task' | undefined {
  return resolutions.value[conflictId]
}

function onApply() {
  if (!props.result || !allResolved.value) return

  // Apply resolutions to the merged content
  const merged = JSON.parse(JSON.stringify(props.result.merged))

  for (const conflict of conflicts.value) {
    const side = resolutions.value[conflict.id]
    if (!side) continue

    const value = side === 'main' ? conflict.mainValue : conflict.taskValue

    if (conflict.kind === 'theme-variable') {
      const varName = conflict.path.replace('theme.', '')
      if (value !== null) {
        merged.theme.variables[varName] = value
      } else {
        delete merged.theme.variables[varName]
      }
    } else if (conflict.kind === 'section-html') {
      const parts = conflict.path.split('.')
      if (parts.length === 3 && parts[2] === 'html') {
        // sections.{id}.html
        const sectionId = parts[1]
        if (merged.sections[sectionId]) {
          merged.sections[sectionId].html = value
        }
      } else if (parts.length === 2) {
        // sections.{id} — whole section conflict (both added)
        const sectionId = parts[1]
        if (value !== null) {
          merged.sections[sectionId] = { id: sectionId, html: value.html, css: value.css }
        } else {
          delete merged.sections[sectionId]
        }
      }
    } else if (conflict.kind === 'section-css') {
      const parts = conflict.path.split('.')
      const sectionId = parts[1]
      if (merged.sections[sectionId]) {
        merged.sections[sectionId].css = value
      }
    } else if (conflict.kind === 'section-deleted') {
      const parts = conflict.path.split('.')
      const sectionId = parts[1]
      if (side === 'task' && conflict.taskValue === null) {
        // Task deleted it — remove
        delete merged.sections[sectionId]
        for (const page of merged.pages) {
          page.sections = page.sections.filter((s: string) => s !== sectionId)
        }
      } else if (side === 'task' && conflict.taskValue !== null) {
        // Task modified it — keep task's version
        merged.sections[sectionId] = {
          id: sectionId,
          html: conflict.taskValue.html,
          css: conflict.taskValue.css,
        }
      } else if (side === 'main' && conflict.mainValue === null) {
        // Main deleted it — remove
        delete merged.sections[sectionId]
        for (const page of merged.pages) {
          page.sections = page.sections.filter((s: string) => s !== sectionId)
        }
      }
      // If side === 'main' and mainValue exists, merged already has main's version
    } else if (conflict.kind === 'section-order') {
      const parts = conflict.path.split('.')
      const pageSlug = parts[1]
      const page = merged.pages.find((p: any) => p.slug === pageSlug)
      if (page) {
        page.sections = [...value]
      }
    }
    // page-added / page-removed: merged defaults to main, swap if task chosen
    else if (conflict.kind === 'page-added' || conflict.kind === 'page-removed') {
      const parts = conflict.path.split('.')
      const pageSlug = parts[1]
      if (side === 'task') {
        if (conflict.taskValue === null) {
          // Task removed the page
          merged.pages = merged.pages.filter((p: any) => p.slug !== pageSlug)
        } else {
          // Task's version of the page
          const existing = merged.pages.find((p: any) => p.slug === pageSlug)
          if (existing) {
            existing.title = conflict.taskValue.title
            existing.sections = conflict.taskValue.sections
          } else {
            merged.pages.push({
              slug: pageSlug,
              title: conflict.taskValue.title,
              sections: conflict.taskValue.sections,
            })
          }
        }
      }
    }
  }

  emit('resolve', { ...props.result, merged, conflicts: props.result.conflicts })
}

// Build a minimal HTML document to preview a section
function buildSectionPreview(html: string | null, css: string | null): string {
  if (html === null) return '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;color:#999;font-family:system-ui;"><p>Deleted</p></body></html>'

  const themeVars = props.theme?.variables ?? {}
  const varCss = Object.entries(themeVars).map(([k, v]) => `${k}: ${v}`).join(';\n  ')
  const fonts = props.theme?.fonts ?? []
  const fontLinks = fonts.map(f =>
    `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
  ).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${fontLinks}
<style>
:root { ${varCss} }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
img { max-width: 100%; height: auto; }
${css ?? ''}
</style>
</head>
<body>${html}</body>
</html>`
}

// Friendly labels
function conflictLabel(conflict: MergeConflict): string {
  if (conflict.kind === 'theme-variable') {
    return conflict.path.replace('theme.', '')
  }
  if (conflict.kind === 'section-html' || conflict.kind === 'section-css') {
    const parts = conflict.path.split('.')
    const sectionId = parts[1]
    const field = parts[2]
    if (field) return `${sectionId} (${field})`
    return sectionId
  }
  if (conflict.kind === 'section-deleted') {
    return conflict.path.split('.')[1] ?? conflict.path
  }
  if (conflict.kind === 'section-order') {
    return `Page "${conflict.path.split('.')[1]}" section order`
  }
  if (conflict.kind === 'page-added' || conflict.kind === 'page-removed') {
    return `Page "${conflict.path.split('.')[1]}"`
  }
  return conflict.path
}

function conflictKindLabel(kind: string): string {
  switch (kind) {
    case 'section-html': return 'Section content'
    case 'section-css': return 'Section styles'
    case 'section-deleted': return 'Section deleted'
    case 'theme-variable': return 'Theme variable'
    case 'page-added': return 'Page added'
    case 'page-removed': return 'Page removed'
    case 'section-order': return 'Section order'
    default: return kind
  }
}

// Group related conflicts (html + css for same section)
const groupedConflicts = computed(() => {
  return conflicts.value
})

const isSectionVisual = (kind: string) =>
  kind === 'section-html' || kind === 'section-deleted'
</script>

<template>
  <Modal :open="open" width="720px" title="Resolve merge conflicts" @close="emit('close')">
    <div class="merge-conflicts">
      <div class="merge-summary">
        <Text variant="caption" color="muted">
          {{ resolvedCount }} of {{ conflicts.length }} conflicts resolved
          <template v-if="result?.autoMergedCount">
            · {{ result.autoMergedCount }} changes auto-merged
          </template>
        </Text>
      </div>

      <div class="conflict-list">
        <div
          v-for="conflict in groupedConflicts"
          :key="conflict.id"
          class="conflict-item"
          :class="{ 'is-resolved': getResolution(conflict.id) }"
        >
          <div class="conflict-header">
            <Text variant="body-small" weight="semibold">{{ conflictLabel(conflict) }}</Text>
            <Text variant="caption" color="muted">{{ conflictKindLabel(conflict.kind) }}</Text>
          </div>

          <!-- Section HTML/deleted: show visual previews -->
          <div v-if="isSectionVisual(conflict.kind)" class="conflict-previews">
            <button
              class="preview-option"
              :class="{
                'is-selected': getResolution(conflict.id) === 'main',
                'is-empty': conflict.mainValue === null,
              }"
              @click="resolve(conflict.id, 'main')"
            >
              <Text variant="caption" weight="semibold" class="option-label">Main site</Text>
              <iframe
                v-if="conflict.mainValue !== null"
                class="preview-iframe"
                :srcdoc="buildSectionPreview(
                  typeof conflict.mainValue === 'object' ? conflict.mainValue.html : conflict.mainValue,
                  typeof conflict.mainValue === 'object' ? conflict.mainValue.css : null
                )"
                sandbox="allow-same-origin"
                tabindex="-1"
              />
              <div v-else class="preview-empty">
                <Text variant="caption" color="muted">Deleted</Text>
              </div>
            </button>
            <button
              class="preview-option"
              :class="{
                'is-selected': getResolution(conflict.id) === 'task',
                'is-empty': conflict.taskValue === null,
              }"
              @click="resolve(conflict.id, 'task')"
            >
              <Text variant="caption" weight="semibold" class="option-label">Task changes</Text>
              <iframe
                v-if="conflict.taskValue !== null"
                class="preview-iframe"
                :srcdoc="buildSectionPreview(
                  typeof conflict.taskValue === 'object' ? conflict.taskValue.html : conflict.taskValue,
                  typeof conflict.taskValue === 'object' ? conflict.taskValue.css : null
                )"
                sandbox="allow-same-origin"
                tabindex="-1"
              />
              <div v-else class="preview-empty">
                <Text variant="caption" color="muted">Deleted</Text>
              </div>
            </button>
          </div>

          <!-- CSS conflicts: show code -->
          <div v-else-if="conflict.kind === 'section-css'" class="conflict-code-pair">
            <button
              class="code-option"
              :class="{ 'is-selected': getResolution(conflict.id) === 'main' }"
              @click="resolve(conflict.id, 'main')"
            >
              <Text variant="caption" weight="semibold" class="option-label">Main site</Text>
              <pre class="code-preview">{{ conflict.mainValue ?? '(none)' }}</pre>
            </button>
            <button
              class="code-option"
              :class="{ 'is-selected': getResolution(conflict.id) === 'task' }"
              @click="resolve(conflict.id, 'task')"
            >
              <Text variant="caption" weight="semibold" class="option-label">Task changes</Text>
              <pre class="code-preview">{{ conflict.taskValue ?? '(none)' }}</pre>
            </button>
          </div>

          <!-- Theme variable: simple value picker -->
          <div v-else-if="conflict.kind === 'theme-variable'" class="conflict-values">
            <button
              class="value-option"
              :class="{ 'is-selected': getResolution(conflict.id) === 'main' }"
              @click="resolve(conflict.id, 'main')"
            >
              <Text variant="caption" weight="semibold">Main site</Text>
              <span
                v-if="conflict.path.includes('color') || conflict.path.includes('bg') || conflict.path.includes('accent') || conflict.path.includes('surface')"
                class="color-swatch"
                :style="{ background: conflict.mainValue }"
              />
              <code>{{ conflict.mainValue ?? '(removed)' }}</code>
            </button>
            <button
              class="value-option"
              :class="{ 'is-selected': getResolution(conflict.id) === 'task' }"
              @click="resolve(conflict.id, 'task')"
            >
              <Text variant="caption" weight="semibold">Task changes</Text>
              <span
                v-if="conflict.path.includes('color') || conflict.path.includes('bg') || conflict.path.includes('accent') || conflict.path.includes('surface')"
                class="color-swatch"
                :style="{ background: conflict.taskValue }"
              />
              <code>{{ conflict.taskValue ?? '(removed)' }}</code>
            </button>
          </div>

          <!-- Fallback: generic side picker -->
          <div v-else class="conflict-values">
            <button
              class="value-option"
              :class="{ 'is-selected': getResolution(conflict.id) === 'main' }"
              @click="resolve(conflict.id, 'main')"
            >
              <Text variant="caption" weight="semibold">Main site</Text>
              <Text variant="caption" color="muted">{{ conflict.mainValue === null ? 'None' : 'Keep' }}</Text>
            </button>
            <button
              class="value-option"
              :class="{ 'is-selected': getResolution(conflict.id) === 'task' }"
              @click="resolve(conflict.id, 'task')"
            >
              <Text variant="caption" weight="semibold">Task changes</Text>
              <Text variant="caption" color="muted">{{ conflict.taskValue === null ? 'None' : 'Keep' }}</Text>
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" variant="tertiary" @click="emit('close')" />
      <Button
        label="Complete merge"
        variant="primary"
        :disabled="!allResolved"
        @click="onApply"
      />
    </template>
  </Modal>
</template>

<style scoped>
.merge-conflicts {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.merge-summary {
  padding-block-start: var(--space-xs);
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.conflict-item {
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: hidden;
  transition: border-color var(--transition-hover);
}

.conflict-item.is-resolved {
  border-color: var(--color-status-running);
}

.conflict-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-s);
  background: var(--color-frame-hover);
}

/* ── Visual previews (section HTML) ── */
.conflict-previews {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--color-frame-border);
}

.preview-option {
  display: flex;
  flex-direction: column;
  background: var(--color-frame-bg);
  border: none;
  padding: 0;
  cursor: pointer;
  outline-offset: -2px;
  transition: outline-color var(--transition-hover);
  outline: 2px solid transparent;
}

.preview-option.is-selected {
  outline-color: var(--color-status-running);
}

.preview-option:hover:not(.is-selected) {
  outline-color: var(--color-frame-fg);
}

.option-label {
  padding: var(--space-xs) var(--space-s);
  text-align: start;
}

.preview-iframe {
  width: 100%;
  height: 200px;
  border: none;
  pointer-events: none;
  background: white;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: var(--color-frame-hover);
}

/* ── Code previews (CSS) ── */
.conflict-code-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--color-frame-border);
}

.code-option {
  display: flex;
  flex-direction: column;
  background: var(--color-frame-bg);
  border: none;
  padding: 0;
  cursor: pointer;
  outline-offset: -2px;
  transition: outline-color var(--transition-hover);
  outline: 2px solid transparent;
  text-align: start;
}

.code-option.is-selected {
  outline-color: var(--color-status-running);
}

.code-option:hover:not(.is-selected) {
  outline-color: var(--color-frame-fg);
}

.code-preview {
  padding: var(--space-xs) var(--space-s);
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xxs);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
  color: var(--color-frame-fg);
}

/* ── Value options (theme vars, fallback) ── */
.conflict-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--color-frame-border);
}

.value-option {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s);
  background: var(--color-frame-bg);
  border: none;
  cursor: pointer;
  outline-offset: -2px;
  transition: outline-color var(--transition-hover);
  outline: 2px solid transparent;
  text-align: start;
}

.value-option.is-selected {
  outline-color: var(--color-status-running);
}

.value-option:hover:not(.is-selected) {
  outline-color: var(--color-frame-fg);
}

.value-option code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xxs);
  color: var(--color-frame-fg);
}

.color-swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-s);
  border: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}
</style>
