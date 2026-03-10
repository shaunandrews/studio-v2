<script setup lang="ts">
import { computed, ref } from 'vue'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import SiteThumbnail from '@/components/composites/SiteThumbnail.vue'
import { useSites } from '@/data/useSites'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(s => s.id === props.siteId))

const siteLayout = computed(() => site.value?.mockLayout ?? 'cafe')
const localPath = computed(() => `/Users/shaun/Studio/${site.value?.id ?? 'site'}`)

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

interface StatItem {
  value: number
  label: string
}

const contentStats = computed<StatItem[]>(() => {
  const layoutStats: Record<string, { posts: number; pages: number; media: number }> = {
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

      <!-- Site overview -->
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

      <!-- Content snapshot -->
      <section class="overview__section">
        <div class="stats">
          <div v-for="stat in contentStats" :key="stat.label" class="stat">
            <span class="stat__value">{{ stat.value }}</span>
            <span class="stat__label">{{ stat.label }}</span>
          </div>
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

.section-heading {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
</style>
