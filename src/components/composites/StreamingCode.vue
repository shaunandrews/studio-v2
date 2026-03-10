<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps<{
  code: string
  active: boolean
}>()

const scrollRef = ref<HTMLElement | null>(null)
const displayedHtml = ref('')

// Character position in the full code string
let charIndex = 0
let timer: ReturnType<typeof setTimeout> | null = null
let fullText = ''

const PHP_KEYWORDS = new Set([
  'function', 'return', 'if', 'else', 'elseif', 'foreach', 'for', 'while',
  'echo', 'class', 'new', 'public', 'private', 'protected', 'static', 'const',
  'use', 'namespace', 'array', 'true', 'false', 'null',
])

const WP_FUNCTIONS = new Set([
  'add_filter', 'add_action', 'get_post_meta', 'get_current_screen',
  'esc_html', 'esc_attr', 'esc_url', 'printf', 'sprintf',
  'wp_enqueue_style', 'wp_enqueue_script', 'register_post_type',
  'add_meta_box', 'update_post_meta', 'wp_nonce_field', 'wp_verify_nonce',
  'sanitize_text_field', 'absint', '__', 'is_admin',
])

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function wrap(cls: string, text: string): string {
  return `<span class="${cls}">${esc(text)}</span>`
}

// Single-pass tokenizer — no regex-on-regex collisions
function highlightPhp(raw: string): string {
  let out = ''
  let i = 0

  while (i < raw.length) {
    // Single-line comment
    if (raw[i] === '/' && raw[i + 1] === '/') {
      const end = raw.indexOf('\n', i)
      const slice = end === -1 ? raw.slice(i) : raw.slice(i, end)
      out += wrap('sc-comment', slice)
      i += slice.length
      continue
    }

    // Multi-line comment
    if (raw[i] === '/' && raw[i + 1] === '*') {
      const end = raw.indexOf('*/', i + 2)
      const slice = end === -1 ? raw.slice(i) : raw.slice(i, end + 2)
      out += wrap('sc-comment', slice)
      i += slice.length
      continue
    }

    // Single-quoted string
    if (raw[i] === "'") {
      let j = i + 1
      while (j < raw.length && raw[j] !== "'") {
        if (raw[j] === '\\') j++
        j++
      }
      const slice = raw.slice(i, j + 1)
      out += wrap('sc-string', slice)
      i = j + 1
      continue
    }

    // Double-quoted string
    if (raw[i] === '"') {
      let j = i + 1
      while (j < raw.length && raw[j] !== '"') {
        if (raw[j] === '\\') j++
        j++
      }
      const slice = raw.slice(i, j + 1)
      out += wrap('sc-string', slice)
      i = j + 1
      continue
    }

    // PHP variable
    if (raw[i] === '$' && /[a-zA-Z_]/.test(raw[i + 1] ?? '')) {
      let j = i + 1
      while (j < raw.length && /\w/.test(raw[j])) j++
      out += wrap('sc-var', raw.slice(i, j))
      i = j
      continue
    }

    // Arrow operators
    if (raw[i] === '-' && raw[i + 1] === '>') {
      out += wrap('sc-op', '-&gt;')
      i += 2
      continue
    }
    if (raw[i] === '=' && raw[i + 1] === '>') {
      out += wrap('sc-op', '=&gt;')
      i += 2
      continue
    }

    // Word (keyword, function, or plain identifier)
    if (/[a-zA-Z_]/.test(raw[i])) {
      let j = i
      while (j < raw.length && /\w/.test(raw[j])) j++
      const word = raw.slice(i, j)
      if (PHP_KEYWORDS.has(word)) {
        out += wrap('sc-keyword', word)
      } else if (WP_FUNCTIONS.has(word)) {
        out += wrap('sc-fn', word)
      } else {
        out += esc(word)
      }
      i = j
      continue
    }

    // Number
    if (/\d/.test(raw[i])) {
      let j = i
      while (j < raw.length && /\d/.test(raw[j])) j++
      out += wrap('sc-num', raw.slice(i, j))
      i = j
      continue
    }

    // Everything else — single char
    out += esc(raw[i])
    i++
  }

  return out
}

function getDelay(): number {
  const ch = fullText[charIndex] ?? ''
  const next = fullText[charIndex + 1] ?? ''
  const prev = fullText[charIndex - 1] ?? ''

  // Pause after blank lines (double newline)
  if (ch === '\n' && next === '\n') return 120
  // Pause at end of statement
  if (ch === ';') return 60
  // Brief pause at line breaks
  if (ch === '\n') return 30
  // Slightly slower at opening braces (thinking moment)
  if (ch === '{') return 45
  // Tab/indent — fast
  if (ch === '\t') return 5
  // Spaces in sequences — fast
  if (ch === ' ' && prev === ' ') return 3
  // Regular characters
  return 8 + Math.random() * 10
}

function tick() {
  if (!props.active) return

  // Append next character
  fullText += props.code[charIndex % props.code.length]
  charIndex++

  // Loop: when we've typed the full code, add a separator and restart
  if (charIndex % props.code.length === 0) {
    fullText += '\n\n'
  }

  // Highlight and update display
  displayedHtml.value = highlightPhp(fullText)

  // Auto-scroll
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    }
  })

  timer = setTimeout(tick, getDelay())
}

function start() {
  if (timer) return
  tick()
}

function stop() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

watch(() => props.active, (isActive) => {
  if (isActive) {
    start()
  } else {
    stop()
  }
})

onMounted(() => {
  if (props.active) start()
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div ref="scrollRef" class="streaming-code">
    <pre class="streaming-code__pre"><code v-html="displayedHtml"></code><span class="streaming-code__cursor" /></pre>
  </div>
</template>

<style scoped>
.streaming-code {
  max-height: 200px;
  overflow-y: auto;
  border-radius: var(--radius-s);
  background: var(--color-frame-fill);
}

.streaming-code__pre {
  margin: 0;
  padding: var(--space-s);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  tab-size: 4;
}

.streaming-code__pre code {
  font-family: inherit;
}

.streaming-code__cursor {
  display: inline-block;
  width: 5px;
  height: 1.1em;
  vertical-align: text-bottom;
  background: var(--color-frame-theme);
  border-radius: 1px;
  animation: sc-blink 0.6s steps(2) infinite;
}

@keyframes sc-blink {
  50% { opacity: 0; }
}

/* Syntax colours */
.streaming-code :deep(.sc-comment) {
  color: var(--color-frame-fg-muted);
  opacity: 0.5;
}

.streaming-code :deep(.sc-string) {
  color: #2e8b57;
}

.streaming-code :deep(.sc-keyword) {
  color: #8b5cf6;
}

.streaming-code :deep(.sc-var) {
  color: var(--color-frame-theme);
}

.streaming-code :deep(.sc-fn) {
  color: #d97706;
}

.streaming-code :deep(.sc-num) {
  color: #dc2626;
}

.streaming-code :deep(.sc-op) {
  color: var(--color-frame-fg-muted);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  :root:not([data-color-scheme="light"]) .streaming-code :deep(.sc-string) {
    color: #6ee7b7;
  }

  :root:not([data-color-scheme="light"]) .streaming-code :deep(.sc-keyword) {
    color: #a78bfa;
  }

  :root:not([data-color-scheme="light"]) .streaming-code :deep(.sc-fn) {
    color: #fbbf24;
  }

  :root:not([data-color-scheme="light"]) .streaming-code :deep(.sc-num) {
    color: #f87171;
  }
}

:root[data-color-scheme="dark"] .streaming-code :deep(.sc-string) {
  color: #6ee7b7;
}

:root[data-color-scheme="dark"] .streaming-code :deep(.sc-keyword) {
  color: #a78bfa;
}

:root[data-color-scheme="dark"] .streaming-code :deep(.sc-fn) {
  color: #fbbf24;
}

:root[data-color-scheme="dark"] .streaming-code :deep(.sc-num) {
  color: #f87171;
}
</style>
