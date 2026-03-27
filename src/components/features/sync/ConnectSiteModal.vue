<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import RadioGroup from '@/components/primitives/RadioGroup.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { search as searchIcon } from '@wordpress/icons'
import { useWpcomSites } from '@/data/useWpcomSites'
import type { WpcomSite } from '@/data/types'

const props = defineProps<{
  open: boolean
  siteName?: string
  stageLabel?: string
  stageEnvironment?: string
  connectedSiteIds?: string[]
}>()

const emit = defineEmits<{
  close: []
  select: [site: WpcomSite]
}>()

// ── Wpcom sites from persona ──

const { wpcomSites: allSites, addWpcomSite } = useWpcomSites()

// ── State ──

type ModalMode = 'suggest' | 'browse' | 'create'
type CreateStep = 'name' | 'provider' | 'creating' | 'done'

const query = ref('')
const selectedId = ref<string | null>(null)
const mode = ref<ModalMode>('suggest')

// ── Create flow state ──

const createStep = ref<CreateStep>('name')
const createName = ref('')
const createProvider = ref<'wpcom' | 'pressable'>('wpcom')
const createdSite = ref<WpcomSite | null>(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selectedId.value = null
    mode.value = 'suggest'
    createStep.value = 'name'
    createName.value = `${props.siteName ?? ''} ${props.stageLabel ?? ''}`.trim()
    createProvider.value = props.stageEnvironment === 'staging' ? 'pressable' : 'wpcom'
    createdSite.value = null
  }
})

// ── Suggested match: best guess based on site name + target environment ──

function nameScore(siteName: string, localName: string): number {
  const a = siteName.toLowerCase()
  const b = localName.toLowerCase()
  // Exact base-name match (e.g. "Studio Meridian" in "Studio Meridian Staging")
  if (a.includes(b) || b.includes(a)) return 3
  // Shared words
  const aWords = new Set(a.split(/\s+/))
  const bWords = b.split(/\s+/)
  const shared = bWords.filter(w => aWords.has(w)).length
  if (shared > 0) return shared
  // URL-based: check if domains share a root
  return 0
}

const suggestedSite = computed(() => {
  if (!props.siteName) return null
  const connected = new Set(props.connectedSiteIds ?? [])
  const candidates = allSites.value
    .filter(s => s.status === 'syncable' && !connected.has(s.id))
    .map(s => ({
      ...s,
      score: nameScore(s.name, props.siteName!) + (s.environmentType === props.stageEnvironment ? 2 : 0),
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
  return candidates[0] ?? null
})

// ── Browse list (excludes suggestion) ──

const sites = computed(() => {
  const connected = new Set(props.connectedSiteIds ?? [])
  const enriched = allSites.value.map(s => ({
    ...s,
    status: connected.has(s.id) ? 'already-connected' as const : s.status,
  }))

  // Exclude the suggested site from the browse list
  const excluded = suggestedSite.value?.id
  const base = enriched.filter(s => s.id !== excluded)

  const q = query.value.toLowerCase().trim()
  const filtered = q
    ? base.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
    : base

  const targetEnv = props.stageEnvironment
  return filtered.sort((a, b) => {
    const aOk = a.status === 'syncable' ? 0 : 1
    const bOk = b.status === 'syncable' ? 0 : 1
    if (aOk !== bOk) return aOk - bOk
    if (targetEnv) {
      const aMatch = a.environmentType === targetEnv ? 0 : 1
      const bMatch = b.environmentType === targetEnv ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
    }
    return a.name.localeCompare(b.name)
  })
})

function statusLabel(status: WpcomSite['status']): string {
  switch (status) {
    case 'already-connected': return 'Already connected'
    case 'needs-upgrade': return 'Upgrade plan'
    case 'needs-transfer': return 'Enable hosting'
    case 'missing-permissions': return 'Missing permissions'
    default: return ''
  }
}

function envLabel(type: WpcomSite['environmentType']): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function envColor(type: WpcomSite['environmentType']): string {
  if (type === 'staging') return 'var(--color-env-staging-bg)'
  if (type === 'production') return 'var(--color-env-production-bg)'
  return 'var(--color-env-local-bg)'
}

function isSelectable(site: WpcomSite): boolean {
  return site.status === 'syncable'
}

function onSelect(site: WpcomSite) {
  if (!isSelectable(site)) return
  selectedId.value = site.id
}

function onConnectSuggested() {
  if (suggestedSite.value) {
    emit('select', suggestedSite.value)
  }
}

function onConnect() {
  const site = sites.value.find(s => s.id === selectedId.value)
  if (site && isSelectable(site)) {
    emit('select', site)
  }
}

// ── Create flow ──

const modalTitle = computed(() => {
  if (mode.value === 'create') return 'Create site'
  return `Connect ${props.stageLabel ?? 'site'}`
})

const providerOptions = computed(() => [
  {
    value: 'wpcom',
    label: 'WordPress.com',
    description: 'Managed WordPress hosting on WordPress.com.',
  },
  {
    value: 'pressable',
    label: 'Pressable',
    description: 'High-performance managed WordPress hosting.',
  },
])

const canAdvanceCreate = computed(() => {
  if (createStep.value === 'name') return createName.value.trim().length > 0
  if (createStep.value === 'provider') return true
  return false
})

function enterCreateFlow() {
  createName.value = `${props.siteName ?? ''} ${props.stageLabel ?? ''}`.trim()
  createProvider.value = props.stageEnvironment === 'staging' ? 'pressable' : 'wpcom'
  createStep.value = 'name'
  createdSite.value = null
  mode.value = 'create'
}

function createStepBack() {
  if (createStep.value === 'name') {
    mode.value = suggestedSite.value ? 'suggest' : 'browse'
    return
  }
  if (createStep.value === 'provider') {
    createStep.value = 'name'
  }
}

function createStepNext() {
  if (createStep.value === 'name') {
    createStep.value = 'provider'
    return
  }
  if (createStep.value === 'provider') {
    createStep.value = 'creating'
    simulateCreation()
  }
}

function simulateCreation() {
  const slug = createName.value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  setTimeout(() => {
    const envType = (['production', 'staging', 'development'].includes(props.stageEnvironment ?? '')
      ? props.stageEnvironment
      : 'production') as WpcomSite['environmentType']
    const newSite: WpcomSite = {
      id: `new-${Date.now()}`,
      name: createName.value.trim(),
      url: `${slug}.${createProvider.value === 'pressable' ? 'mypressable.com' : 'wpcomstaging.com'}`,
      provider: createProvider.value,
      environmentType: envType,
      status: 'syncable',
    }
    createdSite.value = newSite
    addWpcomSite(newSite)
    createStep.value = 'done'
  }, 1500)
}

function onConnectCreated() {
  if (createdSite.value) {
    emit('select', createdSite.value)
  }
}
</script>

<template>
  <Modal :open="open" width="480px" :title="modalTitle" @close="$emit('close')">

    <!-- Suggested match -->
    <div v-if="suggestedSite && mode === 'suggest'" class="csm__suggestion">
      <Text variant="body-small" color="muted" tag="p" class="csm__suggestion-label">Best match</Text>
      <div class="csm__suggestion-card">
        <div class="csm__site-info">
          <span class="csm__site-name">{{ suggestedSite.name }}</span>
          <span class="csm__site-url">{{ suggestedSite.url }}</span>
        </div>
        <div class="csm__site-meta">
          <span
            class="csm__env-badge"
            :style="{ background: envColor(suggestedSite.environmentType) }"
          >{{ envLabel(suggestedSite.environmentType) }}</span>
          <span v-if="suggestedSite.provider === 'pressable'" class="csm__provider">Pressable</span>
        </div>
      </div>
      <div class="csm__suggestion-actions">
        <Button variant="primary" label="Connect" @click="onConnectSuggested" />
        <Button variant="tertiary" size="small" label="Don't see your site? Browse all" @click="mode = 'browse'" />
      </div>
    </div>

    <!-- Browse / search mode -->
    <template v-if="mode === 'browse' || (!suggestedSite && mode === 'suggest')">
      <!-- Search -->
      <div class="csm__search">
        <WPIcon :icon="searchIcon" :size="20" class="csm__search-icon" />
        <input
          v-model="query"
          class="csm__search-input"
          type="text"
          placeholder="Search sites..."
        />
      </div>

      <!-- Site list -->
      <div class="csm__list">
        <div v-if="sites.length === 0" class="csm__empty">
          <p class="csm__empty-text">No sites match your search.</p>
          <Button variant="primary" size="small" label="Create a new site" @click="enterCreateFlow" />
        </div>
        <button
          v-for="site in sites"
          :key="site.id"
          class="csm__site"
          :class="{
            'is-selected': selectedId === site.id,
            'is-disabled': !isSelectable(site),
          }"
          :disabled="!isSelectable(site)"
          @click="onSelect(site)"
        >
          <div class="csm__site-info">
            <span class="csm__site-name">{{ site.name }}</span>
            <span class="csm__site-url">{{ site.url }}</span>
          </div>
          <div class="csm__site-meta">
            <span
              class="csm__env-badge"
              :style="{ background: envColor(site.environmentType) }"
            >{{ envLabel(site.environmentType) }}</span>
            <span v-if="site.provider === 'pressable'" class="csm__provider">Pressable</span>
          </div>
          <span v-if="!isSelectable(site)" class="csm__site-status">
            {{ statusLabel(site.status) }}
          </span>
        </button>
      </div>
    </template>

    <!-- Create flow -->
    <div v-if="mode === 'create'" class="csm__create">
      <!-- Step 1: Name -->
      <div v-if="createStep === 'name'" class="csm__create-step">
        <TextInput
          v-model="createName"
          label="Site name"
          placeholder="My WordPress Site"
          hint="You can change this later."
        />
      </div>

      <!-- Step 2: Provider -->
      <div v-if="createStep === 'provider'" class="csm__create-step">
        <Text variant="body-small" color="muted" tag="p" class="csm__create-step-label">Hosting provider</Text>
        <RadioGroup
          v-model="createProvider"
          :options="providerOptions"
          name="create-provider"
        />
      </div>

      <!-- Step 3: Creating -->
      <div v-if="createStep === 'creating'" class="csm__create-step csm__create-loading">
        <div class="csm__spinner" />
        <Text variant="body-small" color="muted" tag="p">Creating {{ createName }}...</Text>
      </div>

      <!-- Step 4: Done -->
      <div v-if="createStep === 'done' && createdSite" class="csm__create-step">
        <div class="csm__suggestion-card">
          <div class="csm__site-info">
            <span class="csm__site-name">{{ createdSite.name }}</span>
            <span class="csm__site-url">{{ createdSite.url }}</span>
          </div>
          <div class="csm__site-meta">
            <span
              class="csm__env-badge"
              :style="{ background: envColor(createdSite.environmentType) }"
            >{{ envLabel(createdSite.environmentType) }}</span>
            <span v-if="createdSite.provider === 'pressable'" class="csm__provider">Pressable</span>
          </div>
        </div>
        <Text variant="body-small" color="muted" tag="p" class="csm__create-done-text">
          Site created. Connect it to this stage?
        </Text>
      </div>
    </div>

    <template #footer>
      <!-- Browse/suggest modes -->
      <template v-if="mode !== 'create'">
        <Button
          variant="tertiary"
          size="small"
          label="Create a new site"
          class="csm__create-link-btn"
          @click="enterCreateFlow"
        />
        <div v-if="mode === 'browse' || !suggestedSite" class="csm__footer-actions">
          <Button variant="tertiary" label="Cancel" @click="$emit('close')" />
          <Button
            variant="primary"
            label="Connect"
            :disabled="!selectedId"
            @click="onConnect"
          />
        </div>
      </template>

      <!-- Create mode -->
      <template v-if="mode === 'create'">
        <Button
          v-if="createStep === 'name' || createStep === 'provider'"
          variant="tertiary"
          label="Back"
          @click="createStepBack"
        />
        <div class="csm__footer-spacer" />
        <Button
          v-if="createStep === 'name' || createStep === 'provider'"
          variant="primary"
          :label="createStep === 'provider' ? 'Create' : 'Next'"
          :disabled="!canAdvanceCreate"
          @click="createStepNext"
        />
        <Button
          v-if="createStep === 'done'"
          variant="primary"
          label="Connect"
          @click="onConnectCreated"
        />
      </template>
    </template>
  </Modal>
</template>

<style scoped>
/* ── Suggestion ── */

.csm__suggestion {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-block: var(--space-xs);
}

.csm__suggestion-label {
  margin: 0;
}

.csm__suggestion-card {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-hover);
}

.csm__suggestion-actions {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}


/* ── Search ── */

.csm__search {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 12px;
  height: 36px;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
}

.csm__search-icon {
  color: var(--color-frame-fg-muted);
  flex-shrink: 0;
}

.csm__search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-family: inherit;
  font-size: var(--font-size-m);
  line-height: 20px;
  color: var(--color-frame-fg);
}

.csm__search-input::placeholder {
  color: var(--color-frame-fg-muted);
}

/* ── Site list ── */

.csm__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-block: var(--space-s);
  margin-inline: calc(-1 * var(--space-xs));
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.csm__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-xl) var(--space-m);
  text-align: center;
}

.csm__empty-text {
  margin: 0;
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
}

.csm__site {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-xs);
  border: 2px solid transparent;
  border-radius: var(--radius-m);
  background: none;
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  transition:
    background var(--duration-instant) var(--ease-default),
    border-color var(--duration-instant) var(--ease-default);
}

.csm__site:hover:not(.is-disabled) {
  background: var(--color-frame-hover);
}

.csm__site.is-selected {
  border-color: var(--color-frame-theme);
  background: var(--color-frame-hover);
}

.csm__site.is-disabled {
  cursor: default;
  opacity: 0.5;
}

.csm__site-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.csm__site-name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
  color: var(--color-frame-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.csm__site-url {
  font-size: var(--font-size-s);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.csm__site-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  flex-shrink: 0;
}

.csm__env-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding-inline: 4px;
  border-radius: var(--radius-s);
  font-size: var(--font-size-xs);
  line-height: 16px;
  color: rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.csm__provider {
  font-size: var(--font-size-xs);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

.csm__site-status {
  font-size: var(--font-size-xs);
  line-height: 16px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Create flow ── */

.csm__create {
  padding-block: var(--space-xs);
}

.csm__create-step {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.csm__create-step-label {
  margin: 0;
}

.csm__create-loading {
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) 0;
  text-align: center;
}

.csm__create-done-text {
  margin: 0;
}

.csm__spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--color-frame-border);
  border-block-start-color: var(--color-frame-theme);
  border-radius: 50%;
  animation: csm-spin 0.8s linear infinite;
}

@keyframes csm-spin {
  to { transform: rotate(360deg); }
}

/* ── Footer ── */

.csm__create-link-btn {
  margin-inline-end: auto;
}

.csm__footer-spacer {
  flex: 1;
}

.csm__footer-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
</style>
