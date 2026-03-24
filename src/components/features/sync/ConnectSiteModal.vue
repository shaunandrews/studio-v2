<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { search as searchIcon, external } from '@wordpress/icons'

export interface WpcomSite {
  id: string
  name: string
  url: string
  provider: 'wpcom' | 'pressable'
  environmentType: 'production' | 'staging' | 'development'
  status: 'syncable' | 'already-connected' | 'needs-upgrade' | 'needs-transfer' | 'missing-permissions'
}

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

// ── Fake wpcom sites ──

const allSites: WpcomSite[] = [
  { id: 'wpcom-1', name: 'Downstreet Café', url: 'downstreet.cafe', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-2', name: 'Downstreet Café Staging', url: 'staging.downstreet.cafe', provider: 'pressable', environmentType: 'staging', status: 'syncable' },
  { id: 'wpcom-3', name: 'Studio Meridian', url: 'studiomeridian.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-8', name: 'Studio Meridian Staging', url: 'staging.studiomeridian.com', provider: 'pressable', environmentType: 'staging', status: 'syncable' },
  { id: 'wpcom-4', name: 'Meridian Dev', url: 'dev.studiomeridian.com', provider: 'pressable', environmentType: 'development', status: 'syncable' },
  { id: 'wpcom-5', name: 'My Travel Blog', url: 'wanderlustdiaries.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-6', name: 'Starter Site', url: 'shaun2026.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'needs-upgrade' },
  { id: 'wpcom-7', name: 'Old Portfolio', url: 'shaundesign.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'needs-transfer' },
]

// ── State ──

const query = ref('')
const selectedId = ref<string | null>(null)
const browsing = ref(false)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selectedId.value = null
    browsing.value = false
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
  const candidates = allSites
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
  const enriched = allSites.map(s => ({
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
</script>

<template>
  <Modal :open="open" width="480px" :title="`Connect ${stageLabel ?? 'site'}`" @close="$emit('close')">

    <!-- Suggested match -->
    <div v-if="suggestedSite && !browsing" class="csm__suggestion">
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
        <Button variant="tertiary" size="small" label="Don't see your site? Browse all" @click="browsing = true" />
      </div>
    </div>

    <!-- Browse / search mode -->
    <template v-if="!suggestedSite || browsing">
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
          No sites match your search.
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

    <template #footer>
      <a href="https://wordpress.com" target="_blank" rel="noopener" class="csm__create-link">
        Create a new WordPress.com site
        <WPIcon :icon="external" :size="16" />
      </a>
      <div v-if="!suggestedSite || browsing" class="csm__footer-actions">
        <Button variant="tertiary" label="Cancel" @click="$emit('close')" />
        <Button
          variant="primary"
          label="Connect"
          :disabled="!selectedId"
          @click="onConnect"
        />
      </div>
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
  padding: var(--space-xl) var(--space-m);
  text-align: center;
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

/* ── Footer ── */

.csm__create-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-inline-end: auto;
  font-size: var(--font-size-s);
  color: var(--color-frame-theme);
  text-decoration: none;
}

.csm__create-link:hover {
  text-decoration: underline;
}

.csm__footer-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
</style>
