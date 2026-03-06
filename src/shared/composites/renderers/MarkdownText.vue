<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInline(text: string): string {
  let output = text

  output = output.replace(/`([^`]+)`/g, '<code>$1</code>')
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
    if (!/^https?:\/\//i.test(href)) return label
    const safeHref = href.replace(/"/g, '%22')
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })

  return output
}

function renderMarkdown(source: string): string {
  const escaped = escapeHtml(source)
  const fenceRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g
  const fencedBlocks: string[] = []

  const tokenized = escaped.replace(fenceRegex, (_, language = '', code = '') => {
    const index = fencedBlocks.push(
      `<pre><code class="lang-${language}">${code.trimEnd()}</code></pre>`,
    ) - 1
    return `@@FENCE_${index}@@`
  })

  const lines = tokenized.split('\n')
  const html: string[] = []
  let i = 0
  const lineAt = (idx: number): string => lines[idx] ?? ''

  while (i < lines.length) {
    const line = lineAt(i).trimEnd()

    if (!line.trim()) {
      i += 1
      continue
    }

    if (line.includes('@@FENCE_')) {
      html.push(line.replace(/@@FENCE_(\d+)@@/g, (_, idx: string) => fencedBlocks[Number(idx)] ?? ''))
      i += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lineAt(i).trim())) {
        items.push(lineAt(i).trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      html.push(`<ul>${items.map(item => `<li>${renderInline(item)}</li>`).join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lineAt(i).trim())) {
        items.push(lineAt(i).trim().replace(/^\d+\.\s+/, ''))
        i += 1
      }
      html.push(`<ol>${items.map(item => `<li>${renderInline(item)}</li>`).join('')}</ol>`)
      continue
    }

    const paragraphLines: string[] = [line]
    i += 1
    while (
      i < lines.length
      && lineAt(i).trim()
      && !/^[-*]\s+/.test(lineAt(i).trim())
      && !/^\d+\.\s+/.test(lineAt(i).trim())
      && !lineAt(i).includes('@@FENCE_')
    ) {
      paragraphLines.push(lineAt(i).trim())
      i += 1
    }
    html.push(`<p>${renderInline(paragraphLines.join(' '))}</p>`)
  }

  return html.join('')
}

const html = computed(() => renderMarkdown(props.text))
</script>

<template>
  <div class="markdown" v-html="html" />
</template>

<style scoped>
.markdown :deep(p) {
  margin: 0;
}

.markdown :deep(p + p),
.markdown :deep(p + ul),
.markdown :deep(p + ol),
.markdown :deep(ul + p),
.markdown :deep(ol + p),
.markdown :deep(pre + p) {
  margin-top: var(--space-xxs);
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-inline-start: 1.2em;
  margin: 0;
}

.markdown :deep(code) {
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-s);
  padding: 0 0.3em;
  font-size: 0.92em;
}

.markdown :deep(pre) {
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-s);
  padding: var(--space-xs);
  overflow-x: auto;
}

.markdown :deep(pre code) {
  border: 0;
  padding: 0;
  background: transparent;
}

.markdown :deep(a) {
  color: var(--color-primary);
}
</style>
