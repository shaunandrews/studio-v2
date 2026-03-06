<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@shared/primitives/Modal.vue'
import Button from '@/components/primitives/Button.vue'
import WPIcon from '@shared/primitives/WPIcon.vue'
import { closeSmall, search as searchIcon, external } from '@wordpress/icons'

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
  stageLabel?: string
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
  { id: 'wpcom-4', name: 'Meridian Dev', url: 'dev.studiomeridian.com', provider: 'pressable', environmentType: 'development', status: 'syncable' },
  { id: 'wpcom-5', name: 'My Travel Blog', url: 'wanderlustdiaries.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-6', name: 'Starter Site', url: 'shaun2026.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'needs-upgrade' },
  { id: 'wpcom-7', name: 'Old Portfolio', url: 'shaundesign.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'needs-transfer' },
]

// ── Search + filtering ──

const query = ref('')
const selectedId = ref<string | null>(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selectedId.value = null
  }
})

const sites = computed(() => {
  const connected = new Set(props.connectedSiteIds ?? [])
  const enriched = allSites.map(s => ({
    ...s,
    status: connected.has(s.id) ? 'already-connected' as const : s.status,
  }))

  const q = query.value.toLowerCase().trim()
  const filtered = q
    ? enriched.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
    : enriched

  // Syncable first, then alphabetical within groups
  return filtered.sort((a, b) => {
    const aOk = a.status === 'syncable' ? 0 : 1
    const bOk = b.status === 'syncable' ? 0 : 1
    if (aOk !== bOk) return aOk - bOk
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
  if (type === 'staging') return 'var(--color-env-staging)'
  if (type === 'production') return 'var(--color-env-production)'
  return 'var(--color-env-local)'
}

function isSelectable(site: WpcomSite): boolean {
  return site.status === 'syncable'
}

function onSelect(site: WpcomSite) {
  if (!isSelectable(site)) return
  selectedId.value = site.id
}

function onConnect() {
  const site = sites.value.find(s => s.id === selectedId.value)
  if (site && isSelectable(site)) {
    emit('select', site)
  }
}
</script>

<template>
  <Modal :open="open" width="480px" @close="$emit('close')">
    <!-- Header -->
    <div class="csm__header">
      <span class="csm__title">Connect {{ stageLabel ?? 'site' }}</span>
      <button class="csm__close" @click="$emit('close')">
        <WPIcon :icon="closeSmall" :size="24" />
      </button>
    </div>

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

    <!-- Footer -->
    <div class="csm__footer">
      <a href="https://wordpress.com" target="_blank" rel="noopener" class="csm__create-link">
        Create a new WordPress.com site
        <WPIcon :icon="external" :size="16" />
      </a>
      <div class="csm__footer-actions">
        <Button variant="tertiary" label="Cancel" @click="$emit('close')" />
        <Button
          variant="primary"
          label="Connect"
          :disabled="!selectedId"
          @click="onConnect"
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* ── Header ── */

.csm__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
}

.csm__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-frame-fg);
}

.csm__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition:
    background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.csm__close:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}

/* ── Search ── */

.csm__search {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0 16px;
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
  padding: 12px 8px;
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
  background: var(--color-frame-bg-secondary);
}

.csm__site.is-selected {
  border-color: var(--color-primary);
  background: var(--color-frame-bg-secondary);
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

.csm__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-block-start: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.csm__create-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-s);
  color: var(--color-primary);
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
