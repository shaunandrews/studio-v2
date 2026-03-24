<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  if (props.mode === 'push') return props.destLabel ?? 'Remote'
  return selectedEnv.value?.label ?? 'Remote'
})

const visualTopUrl = computed(() => {
  if (props.mode === 'push') return props.destUrl
  return selectedEnv.value?.url
})

const visualBottomLabel = computed(() => {
  if (props.mode === 'push') return props.sourceLabel ?? 'Studio'
  return 'Studio'
})

const visualBottomUrl = computed(() => {
  if (props.mode === 'push') return props.sourceUrl
  return props.localUrl
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
  <Modal :open="open" :title="title" width="510px" @close="$emit('close')">
    <div class="sync-modal__body vstack gap-m">
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

        <div class="sync-env-picker hstack align-center justify-center gap-xxs">
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

      <!-- Sync visual: remote on top, local on bottom. Arrow rotates to show direction. -->
      <div class="sync-visual vstack align-center justify-center gap-xxxs">
        <div
          class="sync-visual__card hstack align-center justify-center gap-xxxs"
          :style="{ background: envColor(visualTopLabel) }"
        >
          <span class="sync-visual__label">{{ visualTopLabel }}</span>
          <span class="sync-visual__url">{{ (visualTopUrl ?? '').replace(/^https?:\/\//, '') }}</span>
        </div>
        <div class="sync-visual__arrow hstack align-center justify-center" :class="{ 'is-pull': resolvedVerb === 'pull' }">
          <svg width="12" height="17" viewBox="0 0 12 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.8271 10.6963C11.12 10.9892 11.12 11.4649 10.8271 11.7578L6.05364 16.5303C5.76075 16.8232 5.28599 16.8232 4.9931 16.5303L0.21966 11.7578C-0.0732332 11.4649 -0.0732331 10.9892 0.21966 10.6963C0.512554 10.4034 0.98829 10.4034 1.28118 10.6963L4.77337 14.1895L4.77337 0L6.27337 0L6.27337 14.1895L9.76556 10.6963C10.0585 10.4034 10.5342 10.4034 10.8271 10.6963Z" fill="currentColor" />
          </svg>
        </div>
        <div
          class="sync-visual__card hstack align-center justify-center gap-xxxs"
          :style="{ background: envColor(visualBottomLabel) }"
        >
          <span class="sync-visual__label">{{ visualBottomLabel }}</span>
          <span class="sync-visual__url">{{ (visualBottomUrl ?? 'localhost:3920').replace(/^https?:\/\//, '') }}</span>
        </div>
      </div>

      <!-- Description -->
      <p class="sync-modal__description">{{ description }}</p>

      <!-- Sync options -->
      <div class="sync-options shrink-0">
        <!-- Files section -->
        <div class="sync-section">
          <div class="sync-section__header hstack align-center gap-xs">
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
              class="sync-scope-dropdown shrink-0"
            />
          </div>
          <div v-if="filesEnabled && filesScope === 'selected'" class="sync-selector vstack gap-xxs">
            <div
              v-for="{ node, depth } in flatNodes"
              :key="node.id"
              class="tree-row hstack align-center gap-xxs"
              :style="{ marginInlineStart: `${16 + depth * 12}px` }"
            >
              <span
                v-if="node.type !== 'file'"
                class="tree-row__collapse hstack align-center justify-center shrink-0"
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
          <div class="sync-section__header hstack align-center gap-xs">
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
              class="sync-scope-dropdown shrink-0"
            />
          </div>
          <div v-if="databaseEnabled && databaseScope === 'selected'" class="sync-selector vstack gap-xxs">
            <div v-for="table in dbTables" :key="table.id" class="table-row hstack align-center gap-xxs">
              <input type="checkbox" class="table-row__checkbox" v-model="table.checked" />
              <WPIcon :icon="blockTable" :size="18" class="table-row__icon" />
              <span class="table-row__label">{{ table.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="tertiary" label="Cancel" @click="$emit('close')" />
      <Button
        variant="primary"
        :label="resolvedVerb === 'push' ? 'Push' : 'Pull'"
        @click="onSync"
      />
    </template>
  </Modal>
</template>

<style scoped>
/* ── Body layout ── */

.sync-modal__description {
  font-size: var(--font-size-s);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  margin: 0;
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

.sync-env-picker__label {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

/* ── Sync visual ── */

.sync-visual {
  padding: 32px 16px;
  border-radius: 4px;
  /* Figma: radial gradient at 0.2 opacity over flat 5% black */
  background:
    url("data:image/svg+xml;utf8,<svg viewBox='0 0 476 157' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)' opacity='0.2'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(0 7.84 -23.8 0 238 78.4)'><stop stop-color='rgba(0,0,0,0)' offset='0.6'/><stop stop-color='rgba(0,0,0,0.3)' offset='1'/></radialGradient></defs></svg>"),
    linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
  background-size: 100% 100%;
}

.sync-visual__card {
  padding: var(--space-xxs) var(--space-xs);
  border-radius: var(--radius-m);
  font-size: var(--font-size-s);
  line-height: 16px;
  white-space: nowrap;
}

.sync-visual__arrow {
  color: var(--color-frame-fg-muted);
  /* Default: arrow points up (push — local to remote) */
  rotate: 180deg;
  transition: rotate var(--duration-moderate) var(--ease-default);
}

/* Pull: arrow points down (remote to local) */
.sync-visual__arrow.is-pull {
  rotate: 0deg;
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
}

.sync-options__divider {
  height: 1px;
  background: var(--color-frame-border);
}

/* ── Section header ── */

.sync-section__header {
  padding: var(--space-s);
  min-height: 50px;
  box-sizing: border-box;
}

/* ── Sync scope dropdown ── */

/* ── Sync selector (tree / table list) ── */

.sync-selector {
  padding-inline-start: 16px;
  padding-block-end: 12px;
}

/* ── Tree row ── */

.tree-row {
  position: relative;
}

.tree-row__collapse {
  position: absolute;
  inset-inline-start: -20px;
  inset-block-start: 1px;
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
