<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Directive } from 'vue'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import {
  file as fileIcon,
  page as pageIcon,
  brush as brushIcon,
  blockTable,
  chevronDownSmall,
  closeSmall,
} from '@wordpress/icons'
import {
  useSiteContent,
  filesScopeGroups,
  databaseScopeGroups,
  getNodeState,
  toggleNode,
  toggleExpand,
  type TreeNode,
} from '@/data/useSiteContent'

export interface SyncEnv {
  id: string
  label: string
  url?: string
}

const props = withDefaults(defineProps<{
  open: boolean
  actionLabel: string
  verb: 'push' | 'pull' | 'promote'
  mode?: 'push' | 'sync'
  sourceLabel?: string
  sourceUrl?: string
  destLabel?: string
  destUrl?: string
  environments?: SyncEnv[]
  defaultEnvId?: string
  localUrl?: string
}>(), {
  mode: 'push',
})

const emit = defineEmits<{
  close: []
  start: []
  'start-sync': [payload: { verb: 'push' | 'pull'; envId: string }]
}>()

// ── Sync mode state ──

const direction = ref<'push' | 'pull'>('pull')
const selectedEnvId = ref<string>('')

const selectedEnv = computed(() =>
  props.environments?.find(e => e.id === selectedEnvId.value)
)

const envDropdownGroups = computed(() => [{
  label: '',
  options: (props.environments ?? []).map(e => ({ value: e.id, label: e.label })),
}])

// ── Resolved verb ──

const resolvedVerb = computed(() => {
  if (props.mode === 'push') return props.verb
  return direction.value
})

// ── Visual card data ──
// In sync mode: Studio is always the first card, remote env is always the second.
// CSS transforms swap their visual position on pull (so remote appears on top).
// In push mode (from connectors): source/dest come from props, no animation.

const visualTopLabel = computed(() => {
  if (props.mode === 'push') return props.sourceLabel ?? 'Studio'
  return 'Studio'
})

const visualTopUrl = computed(() => {
  if (props.mode === 'push') return props.sourceUrl
  return props.localUrl
})

const visualBottomLabel = computed(() => {
  if (props.mode === 'push') return props.destLabel ?? 'Remote'
  return selectedEnv.value?.label ?? 'Remote'
})

const visualBottomUrl = computed(() => {
  if (props.mode === 'push') return props.destUrl
  return selectedEnv.value?.url
})

// ── Description text uses actual source/dest (not visual position) ──

const resolvedSourceLabel = computed(() => {
  if (props.mode === 'push') return props.sourceLabel
  return direction.value === 'push' ? 'Studio' : (selectedEnv.value?.label ?? 'Remote')
})

const resolvedDestLabel = computed(() => {
  if (props.mode === 'push') return props.destLabel
  return direction.value === 'push' ? (selectedEnv.value?.label ?? 'Remote') : 'Studio'
})

// ── Section toggles & scope ──

const siteContent = useSiteContent()
const {
  filesEnabled, databaseEnabled, filesScope, databaseScope,
  fileTree, dbTables, flatNodes,
} = siteContent

// ── Reset on open ──

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    siteContent.reset()
    // Initialize sync mode state
    if (props.mode === 'sync') {
      direction.value = props.verb === 'push' ? 'push' : 'pull'
      const hasDefault = props.defaultEnvId && props.environments?.some(e => e.id === props.defaultEnvId)
      selectedEnvId.value = hasDefault ? props.defaultEnvId! : (props.environments?.[0]?.id ?? '')
    }
  }
})

// ── Icon lookup ──

function getIcon(node: TreeNode) {
  if (node.type === 'theme') return brushIcon
  if (node.type === 'file') return pageIcon
  return fileIcon
}

// ── Indeterminate directive ──

const vIndeterminate: Directive<HTMLInputElement, boolean> = {
  mounted(el, { value }) {
    el.indeterminate = value
  },
  updated(el, { value }) {
    el.indeterminate = value
  },
}

// ── Environment colors ──

function envColor(label?: string): string {
  const l = (label ?? '').toLowerCase()
  if (l === 'production') return 'var(--color-env-production-bg)'
  if (l === 'staging') return 'var(--color-env-staging-bg)'
  return 'var(--color-env-local-bg)'
}

// ── Scroll-aware borders ──

const contentRef = ref<HTMLElement | null>(null)
const scrolledTop = ref(false)
const scrolledBottom = ref(false)

function onContentScroll() {
  const el = contentRef.value
  if (!el) return
  scrolledTop.value = el.scrollTop > 0
  scrolledBottom.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    requestAnimationFrame(() => onContentScroll())
  }
})

// Recheck borders when content height changes
watch([filesEnabled, databaseEnabled, filesScope, databaseScope], () => {
  nextTick(() => onContentScroll())
})

// ── Description ──

const title = computed(() => {
  if (props.mode === 'sync') return 'Sync'
  if (props.verb === 'pull') {
    return `Pull from ${props.sourceLabel ?? 'Remote'}`
  }
  return `Push to ${props.destLabel ?? 'Remote'}`
})

const description = computed(() => {
  if (resolvedVerb.value === 'pull') {
    return `The selected site data will be pulled from ${resolvedSourceLabel.value ?? 'the remote site'} to your local site, overwriting any existing files, folders, and data.`
  }
  return `The selected site data will be pushed from your local site to ${resolvedDestLabel.value ?? 'the remote site'}, overwriting any existing files, folders, and data.`
})

function onSync() {
  if (props.mode === 'sync') {
    emit('start-sync', { verb: direction.value, envId: selectedEnvId.value })
  } else {
    emit('start')
  }
}
</script>

<template>
  <Modal :open="open" width="510px" @close="$emit('close')">
    <!-- Header -->
    <div class="sync-modal__header" :class="{ 'has-border': scrolledTop }">
      <span class="sync-modal__title">{{ title }}</span>
      <button class="sync-modal__close" @click="$emit('close')">
        <WPIcon :icon="closeSmall" :size="24" />
      </button>
    </div>

    <!-- Content -->
    <div ref="contentRef" class="sync-modal__content" @scroll="onContentScroll">
      <!-- Sync mode: segmented control + env picker -->
      <template v-if="mode === 'sync'">
        <div class="segmented-control" :class="{ 'is-pull': direction === 'pull' }">
          <div class="segmented-control__indicator" />
          <button
            :class="['segmented-control__segment', { 'is-active': direction === 'push' }]"
            @click="direction = 'push'"
          >Push</button>
          <button
            :class="['segmented-control__segment', { 'is-active': direction === 'pull' }]"
            @click="direction = 'pull'"
          >Pull</button>
        </div>

        <div class="sync-env-picker">
          <span class="sync-env-picker__label">
            {{ direction === 'push' ? 'Push to' : 'Pull from' }}
          </span>
          <Dropdown
            v-model="selectedEnvId"
            :groups="envDropdownGroups"
            :show-chevron="true"
            size="small"
            menu-surface="dark"
            placement="below"
            align="start"
          />
        </div>
      </template>

      <!-- Sync visual -->
      <!-- In sync mode: Local always first in DOM, remote always second.
           CSS transforms swap positions on pull so remote visually appears on top.
           In push mode: source/dest from props, no swap needed. -->
      <div class="sync-visual" :class="{ 'is-pull': mode === 'sync' && direction === 'pull' }">
        <div class="sync-visual__card sync-visual__top" :style="{ background: envColor(visualTopLabel) }">
          <span class="sync-visual__label">{{ visualTopLabel }}</span>
          <span class="sync-visual__url">{{ (visualTopUrl ?? 'localhost:3920').replace(/^https?:\/\//, '') }}</span>
        </div>
        <div class="sync-visual__arrow">
          <svg class="sync-visual__arrow-svg" width="21" height="11" viewBox="0 0 20.75 11.047" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.6963 0.21967C14.9892 -0.0732234 15.4649 -0.0732234 15.7578 0.21967L20.5303 4.99311C20.8232 5.286 20.8232 5.76076 20.5303 6.05365L15.7578 10.8271C15.4649 11.12 14.9892 11.12 14.6963 10.8271C14.4034 10.5342 14.4034 10.0585 14.6963 9.76557L18.1895 6.27338H0V4.77338H18.1895L14.6963 1.28119C14.4034 0.9883 14.4034 0.512563 14.6963 0.21967Z" fill="currentColor" />
          </svg>
        </div>
        <div class="sync-visual__card sync-visual__bottom" :style="{ background: envColor(visualBottomLabel) }">
          <span class="sync-visual__label">{{ visualBottomLabel }}</span>
          <span class="sync-visual__url">{{ (visualBottomUrl ?? '').replace(/^https?:\/\//, '') }}</span>
        </div>
      </div>

      <!-- Description -->
      <p class="sync-modal__description">{{ description }}</p>

      <!-- Sync options -->
      <div class="sync-options">
        <!-- Files section -->
        <div class="sync-section">
          <div class="sync-section__header">
            <Toggle v-model="filesEnabled" label="Files and folders" />
            <Dropdown
              v-if="filesEnabled"
              v-model="filesScope"
              :groups="filesScopeGroups"
              :show-chevron="true"
              size="small"
              menu-surface="dark"
              placement="below"
              align="end"
              class="sync-scope-dropdown"
            />
          </div>
          <div v-if="filesEnabled && filesScope === 'selected'" class="sync-selector">
            <div
              v-for="{ node, depth } in flatNodes"
              :key="node.id"
              class="tree-row"
              :style="{ marginInlineStart: `${16 + depth * 12}px` }"
            >
              <span
                v-if="node.type !== 'file'"
                class="tree-row__collapse"
                @click="toggleExpand(node)"
              >
                <WPIcon
                  :icon="chevronDownSmall"
                  :size="18"
                  :class="{ 'is-collapsed': !node.expanded }"
                />
              </span>
              <input
                type="checkbox"
                class="tree-row__checkbox"
                :checked="getNodeState(node) === 'checked'"
                v-indeterminate="getNodeState(node) === 'indeterminate'"
                @change="toggleNode(node)"
              />
              <WPIcon :icon="getIcon(node)" :size="18" class="tree-row__icon" />
              <span class="tree-row__label">{{ node.label }}</span>
            </div>
          </div>
        </div>

        <div class="sync-options__divider" />

        <!-- Database section -->
        <div class="sync-section">
          <div class="sync-section__header">
            <Toggle v-model="databaseEnabled" label="Database" />
            <Dropdown
              v-if="databaseEnabled"
              v-model="databaseScope"
              :groups="databaseScopeGroups"
              :show-chevron="true"
              size="small"
              menu-surface="dark"
              placement="below"
              align="end"
              class="sync-scope-dropdown"
            />
          </div>
          <div v-if="databaseEnabled && databaseScope === 'selected'" class="sync-selector">
            <div v-for="table in dbTables" :key="table.id" class="table-row">
              <input type="checkbox" class="table-row__checkbox" v-model="table.checked" />
              <WPIcon :icon="blockTable" :size="18" class="table-row__icon" />
              <span class="table-row__label">{{ table.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="sync-modal__footer" :class="{ 'has-border': scrolledBottom }">
      <Button variant="tertiary" label="Cancel" @click="$emit('close')" />
      <Button
        variant="primary"
        :label="resolvedVerb === 'push' ? 'Push' : 'Pull'"
        @click="onSync"
      />
    </div>
  </Modal>
</template>

<style scoped>
/* ── Modal layout ── */

.sync-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-block-end: 1px solid transparent;
  flex-shrink: 0;
  transition: border-color var(--duration-instant) var(--ease-default);
}

.sync-modal__header.has-border {
  border-block-end-color: var(--color-frame-border);
}

.sync-modal__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-frame-fg);
}

.sync-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition:
    background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.sync-modal__close:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.sync-modal__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sync-modal__description {
  font-size: var(--font-size-s);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  margin: 0;
}

.sync-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-block-start: 1px solid transparent;
  flex-shrink: 0;
  transition: border-color var(--duration-instant) var(--ease-default);
}

.sync-modal__footer.has-border {
  border-block-start-color: var(--color-frame-border);
}

/* ── Segmented control ── */

.segmented-control {
  position: relative;
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-frame-border);
  border-radius: 6px;
  overflow: clip;
}

.segmented-control__indicator {
  position: absolute;
  inset-block-start: 2px;
  inset-inline-start: 2px;
  width: calc(50% - 3px);
  height: calc(100% - 4px);
  border-radius: 4px;
  background: var(--color-frame-fg);
  transition: inset-inline-start 200ms var(--ease-default);
}

.segmented-control.is-pull .segmented-control__indicator {
  inset-inline-start: calc(50% + 1px);
}

.segmented-control__segment {
  position: relative;
  z-index: 1;
  flex: 1;
  height: 32px;
  min-width: 70px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  line-height: 20px;
  cursor: pointer;
  transition: color 200ms var(--ease-default);
}

.segmented-control__segment.is-active {
  color: var(--color-frame-bg);
}

/* ── Env picker ── */

.sync-env-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sync-env-picker__label {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

/* ── Sync visual ── */

.sync-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 32px 16px;
  border-radius: 4px;
  /* Figma: radial gradient at 0.2 opacity over flat 5% black */
  background:
    url("data:image/svg+xml;utf8,<svg viewBox='0 0 476 157' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)' opacity='0.2'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(0 7.84 -23.8 0 238 78.4)'><stop stop-color='rgba(0,0,0,0)' offset='0.6'/><stop stop-color='rgba(0,0,0,0.3)' offset='1'/></radialGradient></defs></svg>"),
    linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
  background-size: 100% 100%;
}

.sync-visual__card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: var(--font-size-s);
  line-height: 16px;
  white-space: nowrap;
  transition: transform 200ms var(--ease-default);
}

.sync-visual__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 21px;
  color: var(--color-frame-fg-muted);
}

.sync-visual__arrow-svg {
  transform: rotate(90deg);
}

/* Pull animation: swap card positions so remote slides to top, local slides to bottom.
   Offset = card(~34px) + gap(4px) + arrow(21px) + gap(4px) = 63px */
.sync-visual.is-pull .sync-visual__top {
  transform: translateY(63px);
}

.sync-visual.is-pull .sync-visual__bottom {
  transform: translateY(-63px);
}

.sync-visual__label {
  color: rgba(0, 0, 0, 1);
}

.sync-visual__url {
  color: rgba(0, 0, 0, 0.7);
}

/* ── Sync options container ── */

.sync-options {
  border: 1px solid var(--color-frame-border);
  border-radius: 8px;
  flex-shrink: 0;
}

.sync-options__divider {
  height: 1px;
  background: var(--color-frame-border);
}

/* ── Section header ── */

.sync-section__header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s);
  min-height: 50px;
  box-sizing: border-box;
}

/* ── Sync scope dropdown ── */

.sync-scope-dropdown {
  flex-shrink: 0;
}

/* ── Sync selector (tree / table list) ── */

.sync-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-inline-start: 16px;
  padding-block-end: 12px;
}

/* ── Tree row ── */

.tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.tree-row__collapse {
  position: absolute;
  inset-inline-start: -20px;
  inset-block-start: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  cursor: pointer;
  color: var(--color-frame-fg-muted);
}

.tree-row__collapse:hover {
  color: var(--color-frame-fg);
}

.tree-row__collapse .is-collapsed {
  transform: rotate(-90deg);
}

.tree-row__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--color-frame-theme);
}

.tree-row__icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.tree-row__label {
  font-size: var(--font-size-m);
  line-height: 20px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Table row ── */

.table-row {
  display: flex;
  align-items: center;
  gap: 8px;
  /* Indent to align with file tree checkboxes (16px base margin + chevron column space) */
  margin-inline-start: 16px;
}

.table-row__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--color-frame-theme);
}

.table-row__icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.table-row__label {
  font-size: var(--font-size-m);
  line-height: 20px;
  color: var(--color-frame-fg-muted);
}
</style>
