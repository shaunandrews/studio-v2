<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { MockLayout } from '@/data/types'

defineProps<{
  layout?: MockLayout
  name?: string
}>()

defineEmits<{
  click: []
}>()

// -- Dynamic scale --
const thumbRef = ref<HTMLButtonElement | null>(null)
const mockWidth = 1000
const scale = ref(0.3)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!thumbRef.value) return
  ro = new ResizeObserver(([entry]) => {
    scale.value = entry.contentRect.width / mockWidth
  })
  ro.observe(thumbRef.value)
})

onUnmounted(() => ro?.disconnect())

const mockStyle = computed(() => ({
  transform: `scale(${scale.value})`,
}))

// -- Tilt effect --
const tiltX = ref(0)
const tiltY = ref(0)
const shineX = ref(50)
const shineY = ref(50)
const isTilting = ref(false)

const tiltStyle = computed(() => ({
  transform: isTilting.value
    ? `perspective(600px) rotateX(${tiltY.value}deg) rotateY(${tiltX.value}deg) scale(1.02)`
    : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
}))

const shineStyle = computed(() => ({
  opacity: isTilting.value ? '1' : '0',
  background: `radial-gradient(circle at ${shineX.value}% ${shineY.value}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
}))

function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  tiltX.value = (x - 0.5) * 10
  tiltY.value = (0.5 - y) * 8
  shineX.value = x * 100
  shineY.value = y * 100
  isTilting.value = true
}

function onLeave() {
  isTilting.value = false
  tiltX.value = 0
  tiltY.value = 0
}
</script>

<template>
  <button
    ref="thumbRef"
    class="site-thumb"
    :style="tiltStyle"
    @mousemove="onMove"
    @mouseleave="onLeave"
    @click="$emit('click')"
  >
    <div class="site-thumb__shine" :style="shineStyle" />

    <!-- Café -->
    <div v-if="layout === 'cafe' || !layout" class="site-thumb__mock mock--cafe" :style="mockStyle">
      <div class="mock__nav">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links"><a>Menu</a><a>About</a><a>Reservations</a><a>Visit</a></div>
      </div>
      <div class="mock__hero" style="height: 180px">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop&q=80" alt="" />
        <div class="mock__hero-overlay"><strong>{{ name || 'My Site' }}</strong></div>
      </div>
      <div class="mock__grid-3">
        <div class="mock__card">
          <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&q=80" alt="" />
          <div class="mock__card-body">
            <span class="mock__card-title">Espresso Bar</span>
            <span class="mock__card-desc">Single origin and seasonal blends</span>
          </div>
        </div>
        <div class="mock__card">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&q=80" alt="" />
          <div class="mock__card-body">
            <span class="mock__card-title">Kitchen</span>
            <span class="mock__card-desc">Farm-to-table brunch and lunch</span>
          </div>
        </div>
        <div class="mock__card">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80" alt="" />
          <div class="mock__card-body">
            <span class="mock__card-title">Private Events</span>
            <span class="mock__card-desc">Book our space for up to 40 guests</span>
          </div>
        </div>
      </div>
      <div class="mock__cafe-info">
        <div class="mock__cafe-info-block">
          <h3>Visit us</h3>
          <p>147 Oak Street, Brooklyn NY<br />Mon – Fri 7am – 6pm<br />Sat – Sun 8am – 5pm</p>
        </div>
        <div class="mock__cafe-info-block">
          <h3>This week</h3>
          <p>Live jazz Friday 7pm · New summer cold brew menu · Patio seating now open</p>
        </div>
        <div class="mock__cafe-info-block">
          <h3>Contact</h3>
          <p>(718) 555-0192<br />hello@downstreetcafe.com</p>
        </div>
      </div>
    </div>

    <!-- Blog -->
    <div v-else-if="layout === 'blog'" class="site-thumb__mock mock--blog" :style="mockStyle">
      <div class="mock__nav">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links"><a>Articles</a><a>Topics</a><a>Newsletter</a><a>About</a></div>
      </div>
      <div class="mock__blog-layout">
        <div class="mock__blog-main">
          <div class="mock__blog-featured">
            <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=300&fit=crop&q=80" alt="" />
          </div>
          <h2 class="mock__blog-title">Design Systems Don't Kill Creativity</h2>
          <p class="mock__blog-excerpt">Why constraints are the best thing that ever happened to your design process, and how the best teams use systems to move faster without losing soul.</p>
          <div class="mock__blog-meta">8 min read · March 2, 2026</div>
          <div class="mock__blog-divider" />
          <div class="mock__blog-post-row">
            <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=140&fit=crop&q=80" alt="" class="mock__blog-post-thumb" />
            <div>
              <h3 class="mock__blog-post-title">The Quiet Power of Boring Technology</h3>
              <p class="mock__blog-post-excerpt">Why the best engineering decisions are the ones nobody talks about at conferences.</p>
              <span class="mock__blog-meta">5 min read · Feb 24, 2026</span>
            </div>
          </div>
          <div class="mock__blog-divider" />
          <div class="mock__blog-post-row">
            <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=200&h=140&fit=crop&q=80" alt="" class="mock__blog-post-thumb" />
            <div>
              <h3 class="mock__blog-post-title">Shipping Weekly Changed Everything</h3>
              <p class="mock__blog-post-excerpt">How a cadence of small releases transformed our team's output and morale.</p>
              <span class="mock__blog-meta">6 min read · Feb 18, 2026</span>
            </div>
          </div>
        </div>
        <div class="mock__blog-sidebar">
          <div class="mock__blog-widget">
            <h4 class="mock__widget-heading">Popular</h4>
            <a class="mock__widget-link">The case for fewer features</a>
            <a class="mock__widget-link">Shipping weekly changed everything</a>
            <a class="mock__widget-link">Why I stopped using Figma</a>
            <a class="mock__widget-link">CSS is better than you think</a>
          </div>
          <div class="mock__blog-widget">
            <h4 class="mock__widget-heading">Topics</h4>
            <div class="mock__tag-list">
              <span class="mock__tag">Design</span>
              <span class="mock__tag">Engineering</span>
              <span class="mock__tag">Process</span>
              <span class="mock__tag">CSS</span>
              <span class="mock__tag">Leadership</span>
              <span class="mock__tag">WordPress</span>
            </div>
          </div>
          <div class="mock__blog-widget">
            <h4 class="mock__widget-heading">Newsletter</h4>
            <p class="mock__widget-desc">Weekly thoughts on building products that matter.</p>
            <div class="mock__widget-input">your@email.com</div>
            <div class="mock__widget-btn">Subscribe</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio -->
    <div v-else-if="layout === 'portfolio'" class="site-thumb__mock mock--portfolio" :style="mockStyle">
      <div class="mock__nav mock__nav--dark">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links mock__nav-links--dark"><a>Work</a><a>Services</a><a>About</a><a>Contact</a></div>
      </div>
      <div class="mock__split-hero">
        <div class="mock__split-text">
          <h1 class="mock__split-heading">We craft digital experiences</h1>
          <p class="mock__split-sub">Strategy, design, and engineering for brands that want to stand out.</p>
          <div class="mock__split-btn">View our work</div>
        </div>
        <div class="mock__split-img">
          <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=500&h=400&fit=crop&q=80" alt="" />
        </div>
      </div>
      <div class="mock__portfolio-section-label">Selected Work</div>
      <div class="mock__img-grid">
        <div class="mock__img-cell">
          <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=350&fit=crop&q=80" alt="" />
          <div class="mock__img-cell-label">
            <span class="mock__img-cell-title">Finova Banking</span>
            <span class="mock__img-cell-tag">Branding · Web</span>
          </div>
        </div>
        <div class="mock__img-cell">
          <img src="https://images.unsplash.com/photo-1545235617-9465d2a55698?w=500&h=350&fit=crop&q=80" alt="" />
          <div class="mock__img-cell-label">
            <span class="mock__img-cell-title">Relay Health</span>
            <span class="mock__img-cell-tag">Product · Design System</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Store -->
    <div v-else-if="layout === 'store'" class="site-thumb__mock mock--store" :style="mockStyle">
      <div class="mock__nav">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links"><a>New In</a><a>Women</a><a>Men</a><a>Sale</a></div>
        <div class="mock__store-nav-right">
          <span class="mock__store-search">Search</span>
          <span class="mock__store-cart">Cart (2)</span>
        </div>
      </div>
      <div class="mock__store-banner">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&h=200&fit=crop&q=80" alt="" />
        <div class="mock__store-banner-text">
          <h2>Spring Collection</h2>
          <p>New arrivals — free shipping over $75</p>
          <div class="mock__store-banner-btn">Shop now</div>
        </div>
      </div>
      <div class="mock__store-section-label">Trending this week</div>
      <div class="mock__store-grid">
        <div class="mock__product">
          <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&q=80" alt="" />
          <div class="mock__product-info">
            <span class="mock__product-name">Classic Watch</span>
            <span class="mock__product-price">$89</span>
          </div>
        </div>
        <div class="mock__product">
          <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&q=80" alt="" />
          <div class="mock__product-info">
            <span class="mock__product-name">Headphones</span>
            <span class="mock__product-price">$129</span>
          </div>
        </div>
        <div class="mock__product">
          <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop&q=80" alt="" />
          <div class="mock__product-info">
            <span class="mock__product-name">Polaroid Camera</span>
            <span class="mock__product-price">$64</span>
          </div>
        </div>
        <div class="mock__product">
          <img src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop&q=80" alt="" />
          <div class="mock__product-info">
            <span class="mock__product-name">Sunglasses</span>
            <span class="mock__product-price">$45</span>
          </div>
        </div>
      </div>
      <div class="mock__store-footer">
        <span>Free returns within 30 days</span>
        <span>·</span>
        <span>Secure checkout</span>
        <span>·</span>
        <span>Worldwide shipping</span>
      </div>
    </div>

    <!-- Landing -->
    <div v-else-if="layout === 'landing'" class="site-thumb__mock mock--landing" :style="mockStyle">
      <div class="mock__nav">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links"><a>Features</a><a>Pricing</a><a>Docs</a></div>
        <div class="mock__landing-nav-right">
          <span class="mock__landing-login">Log in</span>
          <span class="mock__landing-signup">Sign up</span>
        </div>
      </div>
      <div class="mock__landing-hero">
        <h1 class="mock__landing-heading">Ship faster with less complexity</h1>
        <p class="mock__landing-sub">The developer platform that gets out of your way. Build, deploy, and scale without the overhead.</p>
        <div class="mock__landing-cta-row">
          <div class="mock__landing-cta">Get started free</div>
          <div class="mock__landing-cta-secondary">View demo →</div>
        </div>
      </div>
      <div class="mock__landing-features">
        <div class="mock__landing-feature">
          <div class="mock__landing-icon">⚡</div>
          <h3>Instant deploys</h3>
          <p>Push to deploy in under 10 seconds. Zero config, zero downtime.</p>
        </div>
        <div class="mock__landing-feature">
          <div class="mock__landing-icon">🔒</div>
          <h3>Secure by default</h3>
          <p>SSL, DDoS protection, and automated backups included on every plan.</p>
        </div>
        <div class="mock__landing-feature">
          <div class="mock__landing-icon">📊</div>
          <h3>Built-in analytics</h3>
          <p>Real-time metrics without third-party scripts slowing your site down.</p>
        </div>
      </div>
      <div class="mock__landing-stats">
        <div class="mock__landing-stat">
          <span class="mock__landing-stat-num">12k+</span>
          <span class="mock__landing-stat-label">Developers</span>
        </div>
        <div class="mock__landing-stat">
          <span class="mock__landing-stat-num">99.9%</span>
          <span class="mock__landing-stat-label">Uptime</span>
        </div>
        <div class="mock__landing-stat">
          <span class="mock__landing-stat-num">2.4s</span>
          <span class="mock__landing-stat-label">Avg deploy</span>
        </div>
        <div class="mock__landing-stat">
          <span class="mock__landing-stat-num">50+</span>
          <span class="mock__landing-stat-label">Integrations</span>
        </div>
      </div>
    </div>

    <!-- Docs -->
    <div v-else-if="layout === 'docs'" class="site-thumb__mock mock--docs" :style="mockStyle">
      <div class="mock__nav">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links"><a>Guides</a><a>API</a><a>Examples</a></div>
        <div class="mock__docs-search">Search docs…</div>
      </div>
      <div class="mock__docs-layout">
        <div class="mock__docs-sidebar">
          <h4 class="mock__docs-section-title">Getting Started</h4>
          <a class="mock__docs-nav-item">Installation</a>
          <a class="mock__docs-nav-item is-active">Quick Start</a>
          <a class="mock__docs-nav-item">Configuration</a>
          <a class="mock__docs-nav-item">Project Structure</a>
          <a class="mock__docs-nav-item">Deployment</a>
          <h4 class="mock__docs-section-title">Core Concepts</h4>
          <a class="mock__docs-nav-item">Routing</a>
          <a class="mock__docs-nav-item">Data Fetching</a>
          <a class="mock__docs-nav-item">Authentication</a>
          <a class="mock__docs-nav-item">Middleware</a>
          <h4 class="mock__docs-section-title">API Reference</h4>
          <a class="mock__docs-nav-item">CLI Commands</a>
          <a class="mock__docs-nav-item">Config Options</a>
          <a class="mock__docs-nav-item">Plugin API</a>
        </div>
        <div class="mock__docs-content">
          <div class="mock__docs-breadcrumb">Guides → Getting Started → Quick Start</div>
          <h1>Quick Start</h1>
          <p>Get up and running in under five minutes. This guide walks you through creating your first project and deploying it to production.</p>
          <h2>Create a new project</h2>
          <p>Run the following command to scaffold a new project:</p>
          <div class="mock__docs-code">
            <code>npx create-app@latest my-project</code><br />
            <code>cd my-project</code><br />
            <code>npm run dev</code>
          </div>
          <p>Your dev server is now running at <strong>localhost:3000</strong>. Open it in your browser to see the default welcome page.</p>
          <h2>Project structure</h2>
          <p>The scaffolded project has the following layout:</p>
          <div class="mock__docs-code">
            <code>my-project/</code><br />
            <code>├── src/</code><br />
            <code>│   ├── pages/</code><br />
            <code>│   ├── components/</code><br />
            <code>│   └── styles/</code><br />
            <code>├── public/</code><br />
            <code>└── package.json</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Gallery -->
    <div v-else-if="layout === 'gallery'" class="site-thumb__mock mock--gallery" :style="mockStyle">
      <div class="mock__nav mock__nav--dark">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links mock__nav-links--dark"><a>Portfolio</a><a>Prints</a><a>About</a><a>Contact</a></div>
      </div>
      <div class="mock__gallery-grid">
        <div class="mock__gallery-col">
          <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop&q=80" alt="" />
          <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=280&fit=crop&q=80" alt="" />
        </div>
        <div class="mock__gallery-col">
          <img src="https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop&q=80" alt="" />
          <img src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=450&fit=crop&q=80" alt="" />
        </div>
        <div class="mock__gallery-col">
          <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=420&fit=crop&q=80" alt="" />
          <img src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=320&fit=crop&q=80" alt="" />
        </div>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else class="site-thumb__mock mock--cafe" :style="mockStyle">
      <div class="mock__nav">
        <span class="mock__logo">{{ name || 'My Site' }}</span>
        <div class="mock__nav-links"><a>Home</a><a>About</a><a>Contact</a></div>
      </div>
      <div class="mock__hero" style="height: 200px">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop&q=80" alt="" />
        <div class="mock__hero-overlay"><strong>{{ name || 'My Site' }}</strong></div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.site-thumb {
  position: relative;
  flex-shrink: 0;
  width: 90%;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-s);
  border: 1px solid var(--color-frame-border);
  overflow: hidden;
  background: white;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: inherit;
  transition: transform 120ms var(--ease-default), box-shadow 200ms var(--ease-default);
  will-change: transform;
}

.site-thumb:hover {
  box-shadow: 0 4px 16px var(--color-shadow);
}

.site-thumb__shine {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 120ms var(--ease-default);
}

/* ── Shared mock ── */

.site-thumb__mock {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 1000px;
  transform-origin: top left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
  text-align: start;
}

/* ── Shared nav ── */

.mock__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  border-block-end: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
}

.mock__nav--dark {
  background: #1a1a1a;
  border-block-end-color: rgba(255, 255, 255, 0.08);
}

.mock__logo {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.mock__nav--dark .mock__logo {
  color: #fff;
}

.mock__nav-links {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #555;
}

.mock__nav-links--dark {
  color: rgba(255, 255, 255, 0.6);
}

/* ── Café ── */

.mock--cafe {
  background: #faf9f7;
  color: #1a1a1a;
}

.mock__hero {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.mock__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mock__hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: white;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mock__grid-3 {
  display: flex;
  gap: 14px;
  padding: 20px;
}

.mock__card {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.mock__card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.mock__card-body {
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mock__card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mock__card-desc {
  font-size: 11px;
  color: #888;
}

.mock__cafe-info {
  display: flex;
  gap: 32px;
  padding: 20px 24px;
  border-block-start: 1px solid rgba(0, 0, 0, 0.06);
  background: #f5f3f0;
}

.mock__cafe-info-block {
  flex: 1;
}

.mock__cafe-info-block h3 {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #1a1a1a;
}

.mock__cafe-info-block p {
  font-size: 11px;
  line-height: 1.55;
  color: #666;
  margin: 0;
}

/* ── Portfolio ── */

.mock--portfolio {
  background: #111;
  color: #fff;
}

.mock__split-hero {
  display: flex;
  padding: 40px 32px;
  gap: 32px;
  align-items: center;
}

.mock__split-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock__split-heading {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.15;
  margin: 0;
  color: #fff;
}

.mock__split-sub {
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.mock__split-btn {
  margin-block-start: 8px;
  width: fit-content;
  padding: 8px 20px;
  border-radius: 6px;
  background: #fff;
  color: #111;
  font-size: 14px;
  font-weight: 600;
}

.mock__split-img {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
}

.mock__split-img img {
  width: 100%;
  aspect-ratio: 5 / 4;
  object-fit: cover;
  display: block;
}

.mock__portfolio-section-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.4);
  padding: 0 32px 12px;
}

.mock__img-grid {
  display: flex;
  gap: 14px;
  padding: 0 32px 32px;
}

.mock__img-cell {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
}

.mock__img-cell img {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  display: block;
}

.mock__img-cell-label {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.mock__img-cell-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.mock__img-cell-tag {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* ── Blog ── */

.mock--blog {
  background: #fff;
  color: #1a1a1a;
}

.mock__blog-layout {
  display: flex;
  gap: 32px;
  padding: 24px 32px;
}

.mock__blog-main {
  flex: 2;
}

.mock__blog-featured {
  border-radius: 8px;
  overflow: hidden;
  margin-block-end: 16px;
}

.mock__blog-featured img {
  width: 100%;
  aspect-ratio: 2 / 1;
  object-fit: cover;
  display: block;
}

.mock__blog-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 8px;
}

.mock__blog-excerpt {
  font-size: 13px;
  line-height: 1.55;
  color: #666;
  margin: 0;
}

.mock__blog-meta {
  font-size: 11px;
  color: #999;
  margin-block-start: 4px;
}

.mock__blog-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin-block: 14px;
}

.mock__blog-post-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.mock__blog-post-thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.mock__blog-post-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.3;
}

.mock__blog-post-excerpt {
  font-size: 12px;
  color: #777;
  margin: 0;
  line-height: 1.45;
}

.mock__blog-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mock__blog-widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock__widget-desc {
  font-size: 12px;
  color: #777;
  margin: 0;
  line-height: 1.4;
}

.mock__widget-input {
  font-size: 12px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #aaa;
}

.mock__widget-btn {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
  text-align: center;
  width: fit-content;
}

.mock__widget-heading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  margin: 0 0 4px;
}

.mock__widget-link {
  font-size: 13px;
  color: #333;
  text-decoration: none;
  line-height: 1.4;
}

.mock__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mock__tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #555;
}

/* ── Store ── */

.mock--store {
  background: #fff;
  color: #1a1a1a;
}

.mock__store-banner {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.mock__store-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mock__store-banner-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  text-align: center;
}

.mock__store-banner-text h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.mock__store-banner-text p {
  font-size: 13px;
  margin: 6px 0 0;
  opacity: 0.85;
}

.mock__store-banner-btn {
  margin-block-start: 10px;
  padding: 6px 18px;
  border-radius: 4px;
  background: #fff;
  color: #111;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.mock__store-nav-right {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #555;
}

.mock__store-search {
  color: #999;
}

.mock__store-cart {
  font-weight: 600;
}

.mock__store-section-label {
  font-size: 14px;
  font-weight: 700;
  padding: 16px 32px 0;
  color: #333;
}

.mock__store-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 32px;
}

.mock__product {
  border-radius: 8px;
  overflow: hidden;
  background: #f8f8f8;
}

.mock__product img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.mock__product-info {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.mock__product-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.mock__product-price {
  font-size: 13px;
  font-weight: 700;
  color: #111;
}

.mock__store-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 14px 32px;
  font-size: 11px;
  color: #999;
  border-block-start: 1px solid rgba(0, 0, 0, 0.06);
}

/* ── Landing ── */

.mock--landing {
  background: #fff;
  color: #1a1a1a;
}

.mock__landing-hero {
  padding: 48px 32px 40px;
  text-align: center;
}

.mock__landing-heading {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}

.mock__landing-sub {
  font-size: 16px;
  line-height: 1.5;
  color: #666;
  margin: 16px auto 0;
  max-width: 500px;
}

.mock__landing-nav-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mock__landing-login {
  font-size: 13px;
  color: #555;
}

.mock__landing-signup {
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
}

.mock__landing-cta-row {
  display: flex;
  gap: 14px;
  justify-content: center;
  align-items: center;
  margin-block-start: 24px;
}

.mock__landing-cta {
  display: inline-block;
  padding: 10px 28px;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.mock__landing-cta-secondary {
  font-size: 15px;
  font-weight: 500;
  color: #2563eb;
}

.mock__landing-features {
  display: flex;
  gap: 32px;
  padding: 0 64px 40px;
}

.mock__landing-feature {
  flex: 1;
  text-align: center;
}

.mock__landing-feature h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px;
}

.mock__landing-feature p {
  font-size: 13px;
  line-height: 1.5;
  color: #666;
  margin: 0;
}

.mock__landing-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #e8f0fe;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.mock__landing-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 24px 64px;
  border-block-start: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafafa;
}

.mock__landing-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.mock__landing-stat-num {
  font-size: 24px;
  font-weight: 800;
  color: #111;
}

.mock__landing-stat-label {
  font-size: 12px;
  color: #888;
}

/* ── Docs ── */

.mock--docs {
  background: #fff;
  color: #1a1a1a;
}

.mock__docs-layout {
  display: flex;
  min-height: 500px;
}

.mock__docs-sidebar {
  width: 220px;
  flex-shrink: 0;
  padding: 20px 16px;
  border-inline-end: 1px solid rgba(0, 0, 0, 0.08);
}

.mock__docs-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  margin: 16px 0 8px;
}

.mock__docs-section-title:first-child {
  margin-block-start: 0;
}

.mock__docs-nav-item {
  display: block;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #555;
  text-decoration: none;
  line-height: 1.4;
}

.mock__docs-nav-item.is-active {
  background: #e8f0fe;
  color: #1a56db;
  font-weight: 600;
}

.mock__docs-search {
  font-size: 13px;
  color: #aaa;
  padding: 5px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 160px;
}

.mock__docs-breadcrumb {
  font-size: 12px;
  color: #999;
  margin-block-end: 12px;
}

.mock__docs-content {
  flex: 1;
  padding: 24px 32px;
}

.mock__docs-content h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
}

.mock__docs-content h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 20px 0 8px;
}

.mock__docs-content p {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin: 0 0 8px;
}

.mock__docs-code {
  background: #1e293b;
  border-radius: 6px;
  padding: 14px 16px;
  margin: 12px 0 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
}

/* ── Gallery ── */

.mock--gallery {
  background: #111;
  color: #fff;
}

.mock__gallery-grid {
  display: flex;
  gap: 6px;
  padding: 6px;
}

.mock__gallery-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mock__gallery-col img {
  width: 100%;
  display: block;
  border-radius: 4px;
  object-fit: cover;
}
</style>
