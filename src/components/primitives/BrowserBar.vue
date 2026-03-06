<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
export interface BrowserBarPage {
  label: string
  dimmed?: boolean
}

const props = defineProps<{
  url: string
  pages?: Record<string, BrowserBarPage>
  currentPage?: string
}>()

const emit = defineEmits<{
  navigate: [page: string]
}>()

const expanded = ref(false)
const barRef = ref<HTMLElement | null>(null)

function toggle() {
  if (!props.pages || Object.keys(props.pages).length === 0) return
  expanded.value = !expanded.value
}

function selectPage(key: string) {
  emit('navigate', key)
  expanded.value = false
}

function onClickOutside(e: MouseEvent) {
  if (barRef.value && !barRef.value.contains(e.target as Node)) {
    expanded.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onClickOutside))
onUnmounted(() => document.removeEventListener('pointerdown', onClickOutside))
</script>

<template>
  <div ref="barRef" class="browser-bar-wrapper" :class="{ 'is-expanded': expanded }">
    <div class="browser-bar" @click="toggle">
      <span class="browser-bar__url">{{ url }}</span>
      <span v-if="pages && Object.keys(pages).length > 0" class="browser-bar__chevron">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
    <Transition name="dropdown">
      <div v-if="expanded" class="browser-bar__dropdown">
        <button
          v-for="(page, key) in pages"
          :key="key"
          class="browser-bar__page"
          :class="{ 'is-active': key === currentPage, 'is-dimmed': page.dimmed }"
          @click.stop="selectPage(key as string)"
        >
          <span class="browser-bar__page-label">{{ page.label }}</span>
          <span class="browser-bar__page-path">/{{ key === 'homepage' ? '' : key }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.browser-bar-wrapper {
  position: relative;
}

.browser-bar {
  display: flex;
  align-items: center;
  height: 35px;
  padding: 0 var(--space-xs);
  background: var(--color-frame-bg-secondary);
  border-radius: var(--radius-s);
  min-width: 0;
  cursor: pointer;
  transition: background var(--transition-hover);
}

.browser-bar:hover {
  background: var(--color-frame-border);
}

.is-expanded .browser-bar {
  background: var(--color-frame-border);
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}

.browser-bar__url {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.browser-bar__chevron {
  color: var(--color-frame-fg-muted);
  display: flex;
  align-items: center;
  margin-inline-start: var(--space-xxxs);
  transition: transform var(--transition-hover);
}

.is-expanded .browser-bar__chevron {
  transform: rotate(180deg);
}

.browser-bar__dropdown {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 100%;
  background: var(--color-frame-bg-secondary);
  border-end-start-radius: var(--radius-s);
  border-end-end-radius: var(--radius-s);
  border-block-start: 1px solid var(--color-frame-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10;
  padding-block: var(--space-xxxs);
  overflow: hidden;
}

.browser-bar__page {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-xs) var(--space-xs);
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--font-family);
  transition: background var(--transition-hover);
}

.browser-bar__page:hover {
  background: var(--color-chrome-hover);
}

.browser-bar__page.is-active {
  color: var(--color-primary);
}

.browser-bar__page.is-active .browser-bar__page-label,
.browser-bar__page.is-active .browser-bar__page-path {
  /* color: var(--color-primary-text); */
  color: var(--color-primary);
}

.browser-bar__page-label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.browser-bar__page-path {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  flex-shrink: 0;
  margin-inline-start: var(--space-xs);
}

.browser-bar__page.is-dimmed {
  opacity: 0.5;
}

.browser-bar__page.is-dimmed .browser-bar__page-label::after {
  content: ' ⋯';
  font-size: var(--font-size-xs);
  opacity: 0.6;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95) translateY(-2px);
}
</style>
