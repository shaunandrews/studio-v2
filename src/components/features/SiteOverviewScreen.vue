<script setup lang="ts">
import { computed } from 'vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { useSites } from '@/data/useSites'
import { useWPAdmin } from '@/data/useWPAdmin'

const props = defineProps<{
  siteId: string
}>()

const { sites } = useSites()
const site = computed(() => sites.value.find(s => s.id === props.siteId))

const themeType = computed(() => site.value?.themeType ?? 'block')
const features = computed(() => site.value?.features ?? [])
const hasWoo = computed(() => features.value.includes('woocommerce'))

const { adminLinks } = useWPAdmin(themeType, features)

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

      <!-- Quick admin links -->
      <section class="overview__section">
        <span class="section-heading">WordPress</span>
        <div class="admin-links">
          <button
            v-for="link in adminLinks"
            :key="link.label"
            class="admin-link"
          >
            <WPIcon :icon="link.icon" :size="20" class="admin-link__icon" />
            <span class="admin-link__label">{{ link.label }}</span>
          </button>
        </div>
      </section>

      <!-- Content snapshot -->
      <section class="overview__section">
        <span class="section-heading">Content</span>
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
  max-width: 360px;
}

/* ── Sections ── */

.overview__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
}

.section-heading {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Admin links ── */

.admin-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}

.admin-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-s) var(--space-xs);
  border: none;
  border-radius: var(--radius-m);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-s);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.admin-link:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.admin-link__icon {
  color: var(--color-frame-fg-muted);
  transition: color var(--duration-instant) var(--ease-default);
}

.admin-link:hover .admin-link__icon {
  color: var(--color-frame-fg);
}

.admin-link__label {
  line-height: 1;
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
