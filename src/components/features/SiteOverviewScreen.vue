<script setup lang="ts">
import { computed, ref } from 'vue'
import { chevronDown } from '@wordpress/icons'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import ButtonSplit from '@/components/primitives/ButtonSplit.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import SiteThumbnail from '@/components/composites/SiteThumbnail.vue'
import { useSites } from '@/data/useSites'
import { useWPAdmin } from '@/data/useWPAdmin'
import type { SiteStatus } from '@/data/types'

const props = defineProps<{
  siteId: string
  status?: SiteStatus
  loadingTarget?: 'running' | 'stopped'
}>()

const emit = defineEmits<{
  'toggle-status': []
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(s => s.id === props.siteId))

const siteLayout = computed(() => site.value?.mockLayout ?? 'cafe')
const localPath = computed(() => {
  const name = (site.value?.name ?? 'site')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `/Users/shaun/Studio/${name}`
})

const themeType = computed(() => site.value?.themeType ?? 'block')
const siteFeatures = computed(() => site.value?.features ?? [])
const { adminLinks } = useWPAdmin(themeType, siteFeatures)

const copiedField = ref<string | null>(null)
let copiedTimeout: ReturnType<typeof setTimeout> | undefined

function copyToClipboard(text: string, field: string) {
  navigator.clipboard.writeText(text)
  copiedField.value = field
  clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => { copiedField.value = null }, 1500)
}

const features = computed(() => site.value?.features ?? [])
const hasWoo = computed(() => features.value.includes('woocommerce'))

// ── Status ──

const statusLabel = computed(() => {
  if (props.status === 'running') return 'Running'
  if (props.status === 'loading') return props.loadingTarget === 'stopped' ? 'Stopping…' : 'Starting…'
  return 'Stopped'
})

const statusTooltip = computed(() => {
  if (props.status === 'running') return 'Stop site'
  if (props.status === 'loading') return props.loadingTarget === 'stopped' ? 'Stopping…' : 'Starting…'
  return 'Start site'
})

// ── Open In ──

const openLabel = ref('Browser')
const openIconUrl = ref('/icons/chrome.svg')

function onOpenSelect(label: string, iconUrl: string) {
  openLabel.value = label
  openIconUrl.value = iconUrl
}

const openMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      { label: 'Browser', iconUrl: '/icons/chrome.svg', checked: openLabel.value === 'Browser', action: () => onOpenSelect('Browser', '/icons/chrome.svg') },
      { label: 'VS Code', iconUrl: '/icons/vscode.svg', checked: openLabel.value === 'VS Code', action: () => onOpenSelect('VS Code', '/icons/vscode.svg') },
      { label: 'Cursor', iconUrl: '/icons/cursor.svg', checked: openLabel.value === 'Cursor', action: () => onOpenSelect('Cursor', '/icons/cursor.svg') },
      { label: 'Claude', iconUrl: '/icons/claude.svg', checked: openLabel.value === 'Claude', action: () => onOpenSelect('Claude', '/icons/claude.svg') },
      { label: 'Codex', iconUrl: '/icons/codex-color.svg', checked: openLabel.value === 'Codex', action: () => onOpenSelect('Codex', '/icons/codex-color.svg') },
    ],
  },
  {
    items: [
      { label: 'Terminal', iconUrl: '/icons/terminal.svg', checked: openLabel.value === 'Terminal', action: () => onOpenSelect('Terminal', '/icons/terminal.svg') },
      { label: 'Finder', iconUrl: '/icons/finder.svg', checked: openLabel.value === 'Finder', action: () => onOpenSelect('Finder', '/icons/finder.svg') },
    ],
  },
])

// ── Content stats ──

interface StatItem {
  value: number
  label: string
}

const contentStats = computed<StatItem[]>(() => {
  const layoutStats: Record<string, { posts: number; pages: number; media: number }> = {
    default: { posts: 1, pages: 2, media: 0 },
    cafe: { posts: 12, pages: 6, media: 47 },
    portfolio: { posts: 0, pages: 9, media: 84 },
    blog: { posts: 43, pages: 4, media: 22 },
    store: { posts: 8, pages: 14, media: 156 },
    landing: { posts: 2, pages: 3, media: 18 },
    docs: { posts: 28, pages: 12, media: 8 },
    gallery: { posts: 6, pages: 5, media: 210 },
  }
  const l = site.value?.mockLayout ?? 'cafe'
  const s = layoutStats[l] ?? layoutStats.cafe

  const stats: StatItem[] = [
    { value: s.posts, label: 'Posts' },
    { value: s.pages, label: 'Pages' },
    { value: s.media, label: 'Media' },
  ]

  if (hasWoo.value) {
    const wooStats: Record<string, { products: number; orders: number }> = {
      store: { products: 86, orders: 243 },
    }
    const w = wooStats[l] ?? { products: 24, orders: 58 }
    stats.push(
      { value: w.products, label: 'Products' },
      { value: w.orders, label: 'Orders' },
    )
  }

  return stats
})
</script>

<template>
  <div class="overview">
    <div class="overview__content">

      <!-- Site preview + credentials -->
      <div class="site-overview vstack align-center gap-xs">
        <Tooltip text="Open site in browser" placement="top">
          <SiteThumbnail :layout="siteLayout" :name="site?.name" @click="alert('Opening site preview…')" />
        </Tooltip>
        <div class="vstack align-center gap-xxxxs">
          <Text variant="body" weight="semibold" class="overview__url">localhost:3920</Text>
          <span class="hstack gap-xxxs overview__creds">
            <Button variant="tertiary" size="mini" label="admin" :tooltip="copiedField === 'user' ? 'Copied!' : 'Copy username'" tooltip-placement="bottom" @click="copyToClipboard('admin', 'user')" />
            <span class="overview__creds-sep">/</span>
            <Button variant="tertiary" size="mini" label="••••••••" :tooltip="copiedField === 'pass' ? 'Copied!' : 'Copy password'" tooltip-placement="bottom" @click="copyToClipboard('password', 'pass')" />
          </span>
          <Button variant="tertiary" size="mini" :label="localPath" :tooltip="copiedField === 'path' ? 'Copied!' : 'Copy local path'" tooltip-placement="bottom" @click="copyToClipboard(localPath, 'path')" />
        </div>
      </div>

      <!-- Status + Open In -->
      <div class="overview__actions">
        <div class="overview__status">
          <span class="status-label" :class="status ?? 'stopped'">{{ statusLabel }}</span>
          <Tooltip :text="statusTooltip" placement="bottom">
            <button
              class="status-btn"
              :class="status ?? 'stopped'"
              :disabled="status === 'loading'"
              @click="emit('toggle-status')"
            >
              <svg v-if="status === 'loading'" class="status-spinner" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="20 12" />
              </svg>
              <svg v-else class="status-shape" viewBox="0 0 10 10">
                <template v-if="(status ?? 'stopped') === 'stopped'">
                  <rect class="status-rect" x="1" y="1" width="8" height="8" rx="1.5" />
                  <path class="status-play" d="M3.5 1.8 L8.5 5 L3.5 8.2Z" />
                </template>
                <template v-else>
                  <circle class="status-circle" cx="5" cy="5" r="4.5" />
                  <rect class="status-stop" x="1" y="1" width="8" height="8" rx="1.5" />
                </template>
              </svg>
            </button>
          </Tooltip>
        </div>
        <FlyoutMenu :groups="openMenuGroups" surface="dark" align="end">
          <template #trigger="{ toggle }">
            <Tooltip :text="`Open in ${openLabel}`" placement="bottom">
              <ButtonSplit
                :iconUrl="openIconUrl"
                label="Open"
                @click="alert(`Opening in ${openLabel}…`)"
                @secondary-click="toggle"
              />
            </Tooltip>
          </template>
        </FlyoutMenu>
      </div>

      <!-- Content snapshot -->
      <section class="overview__section">
        <div class="stats">
          <div v-for="stat in contentStats" :key="stat.label" class="stat">
            <span class="stat__value">{{ stat.value }}</span>
            <span class="stat__label">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <!-- WordPress shortcuts -->
      <section class="overview__section">
        <div class="shortcuts">
          <button v-for="link in adminLinks" :key="link.label" class="shortcut" @click="alert(`Opening ${link.label}…`)">
            <WPIcon :icon="link.icon" :size="20" class="shortcut__icon" />
            <span class="shortcut__label">{{ link.label }}</span>
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.overview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.overview__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  width: 100%;
  max-width: 480px;
}

/* ── Site overview ── */

.site-overview {
  width: 100%;
  max-width: 320px;
}

/* Override Tooltip's inline-flex trigger so thumb gets full width */
.site-overview > :deep(.tooltip-trigger) {
  display: flex;
  justify-content: center;
  width: 100%;
}

.site-overview :deep(.site-thumb) {
  width: 100%;
}

.overview__url {
  color: var(--color-frame-theme);
  text-decoration: underline;
  cursor: pointer;
}

.overview__creds {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
}

.overview__creds-sep {
  color: var(--color-frame-fg-muted);
  opacity: 0.5;
  margin: 0 1px;
}

/* ── Actions row (status + open in) ── */

.overview__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-s);
  width: 100%;
}

.overview__status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* ── Status ── */

.status-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-frame-fg-muted);
}

.status-label.running {
  color: var(--color-status-running);
}

.status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
              border-color var(--duration-instant) var(--ease-default);
}

.status-btn:hover:not(:disabled) {
  background: var(--color-frame-hover);
}

.status-shape {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.status-shape rect,
.status-shape circle,
.status-shape path {
  transition: opacity 200ms var(--ease-default);
}

.status-rect { fill: var(--color-status-stopped); opacity: 1; }
.status-play { fill: var(--color-status-running); stroke: var(--color-status-running); stroke-width: 1; stroke-linejoin: round; opacity: 0; }
.status-btn.stopped:hover:not(:disabled) .status-rect { opacity: 0; }
.status-btn.stopped:hover:not(:disabled) .status-play { opacity: 1; }

.status-circle { fill: var(--color-status-running); opacity: 1; }
.status-stop { fill: var(--color-status-stop-hover); opacity: 0; }
.status-btn.running:hover:not(:disabled) .status-circle { opacity: 0; }
.status-btn.running:hover:not(:disabled) .status-stop { opacity: 1; }

.status-spinner {
  width: 14px;
  height: 14px;
  color: var(--color-frame-theme);
  animation: overview-spin 0.8s linear infinite;
}

@keyframes overview-spin {
  to { transform: rotate(360deg); }
}

.status-btn:disabled { cursor: default; opacity: 0.7; }
.status-btn.running:hover:not(:disabled) { border-color: var(--color-status-stop-hover); }
.status-btn.stopped:hover:not(:disabled) { border-color: var(--color-status-running); }

/* ── Sections ── */

.overview__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
  background: var(--color-frame-fill);
  padding: var(--space-s);
  border-radius: var(--radius-l);
}

/* ── Content stats ── */

.stats {
  display: flex;
  gap: 2px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  padding: var(--space-xs);
}

.stat__value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  line-height: 1;
}

.stat__label {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

/* ── Shortcuts grid ── */

.shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 2px;
}

.shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
  padding: var(--space-s) var(--space-xxs);
  border: none;
  border-radius: var(--radius-m);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.shortcut:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.shortcut__icon {
  color: var(--color-frame-fg-muted);
  transition: color var(--duration-instant) var(--ease-default);
}

.shortcut:hover .shortcut__icon {
  color: var(--color-frame-fg);
}

.shortcut__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
