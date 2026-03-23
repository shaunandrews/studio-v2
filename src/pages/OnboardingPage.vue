<script setup lang="ts">
import { h, defineComponent, computed, ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { wordpress, lock, globe, connection } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import WindowsTitlebar from '@/components/composites/WindowsTitlebar.vue'
import TrafficLights from '@/components/primitives/TrafficLights.vue'
import DotGrid from '@/components/features/onboarding/DotGrid.vue'
import AuthSimulation from '@/components/features/onboarding/AuthSimulation.vue'
import PermissionDialog from '@/components/features/onboarding/PermissionDialog.vue'
import { useOnboarding } from '@/data/useOnboarding'
import { useOperatingSystem } from '@/data/useOperatingSystem'

const route = useRoute()
const router = useRouter()
const { markVisited } = useOnboarding()
const { isWindows } = useOperatingSystem()

markVisited('welcome')

function svg(viewBox: string, children: ReturnType<typeof h>[]) {
  const parts = viewBox.split(' ').map(Number)
  return h('svg', { width: parts[2], height: parts[3], viewBox, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, children)
}

const IllustrationAI = defineComponent({
  setup() {
    // Wider canvas (140×74), content centered. Shapes same size.
    return () => svg('-1 -1 140 74', [
      h('rect', { x: 4, y: 6, width: 130, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.2 }),
      h('rect', { x: 4, y: 16, width: 105, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.2 }),
      h('rect', { x: 4, y: 26, width: 80, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.15 }),
      // Chat input box — spans full width
      h('rect', { x: 0, y: 44, width: 138, height: 24, rx: 8, stroke: 'currentColor', 'stroke-width': 1, fill: 'currentColor', 'fill-opacity': 0.04, opacity: 0.5 }),
      // Cursor
      h('rect', { x: 14, y: 52, width: 2, height: 8, rx: 1, fill: 'var(--color-chrome-theme)', opacity: 0.9 }),
    ])
  },
})

const IllustrationShare = defineComponent({
  setup() {
    // Wider canvas (140×74), shapes shifted to center (~30px offset)
    const ox = 30
    return () => svg('-1 -1 140 74', [
      h('defs', {}, [
        h('clipPath', { id: 'clip-back-frame' }, [
          h('path', { d: `M-1-1h141v75h-141z M${2 + ox} 22 v46 h62 v-46 z`, 'clip-rule': 'evenodd' }),
        ]),
      ]),
      h('rect', { x: 14 + ox, y: 2, width: 62, height: 46, rx: 7, stroke: 'currentColor', 'stroke-width': 1, fill: 'none', opacity: 0.25, 'clip-path': 'url(#clip-back-frame)' }),
      h('rect', { x: 2 + ox, y: 22, width: 62, height: 46, rx: 7, stroke: 'currentColor', 'stroke-width': 1, fill: 'currentColor', 'fill-opacity': 0.05, opacity: 0.55 }),
      h('line', { x1: 2 + ox, y1: 34, x2: 64 + ox, y2: 34, stroke: 'currentColor', 'stroke-width': 1, opacity: 0.12 }),
      h('circle', { cx: 12 + ox, cy: 28, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('circle', { cx: 19 + ox, cy: 28, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('circle', { cx: 26 + ox, cy: 28, r: 2, fill: 'currentColor', opacity: 0.25 }),
      h('path', { d: `M${30 + ox} 58 L${30 + ox} 46 L${50 + ox} 46`, stroke: 'currentColor', 'stroke-width': 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', opacity: 0.25 }),
      h('path', { d: `M${44 + ox} 40 L${50 + ox} 46 L${44 + ox} 52`, stroke: 'var(--color-chrome-theme)', 'stroke-width': 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', opacity: 0.7 }),
    ])
  },
})

const IllustrationSync = defineComponent({
  setup() {
    // Wider canvas (140×74), pills spread wider across the space
    return () => svg('-1 -1 140 74', [
      // Local pill (top-left)
      h('rect', { x: 0, y: 8, width: 56, height: 16, rx: 4, stroke: 'currentColor', 'stroke-width': 1, fill: 'currentColor', 'fill-opacity': 0.05, opacity: 0.5 }),
      h('rect', { x: 8, y: 13, width: 28, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.15 }),
      // Staging pill (middle)
      h('rect', { x: 36, y: 30, width: 56, height: 16, rx: 4, stroke: 'var(--color-env-staging-bg)', 'stroke-width': 1, fill: 'var(--color-env-staging-bg)', 'fill-opacity': 0.15, opacity: 0.8 }),
      h('rect', { x: 44, y: 35, width: 32, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.12 }),
      // Production pill (bottom-right)
      h('rect', { x: 72, y: 52, width: 60, height: 16, rx: 4, stroke: 'var(--color-env-production-bg)', 'stroke-width': 1, fill: 'var(--color-env-production-bg)', 'fill-opacity': 0.15, opacity: 0.8 }),
      h('rect', { x: 80, y: 57, width: 36, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.12 }),
    ])
  },
})

const headline = 'Build here. Go anywhere.'

const features = [
  { illustration: IllustrationAI, label: 'AI-powered building', desc: 'Use AI to build sites, themes, and plugins' },
  { illustration: IllustrationShare, label: 'Easy previews', desc: 'Share preview sites with clients and colleagues' },
  { illustration: IllustrationSync, label: 'Seamless sync', desc: 'Sync with WordPress.com and Pressable' },
]

const step = computed(() => {
  if (route.name === 'permissions') return 'permissions'
  if (route.name === 'oauth') return 'welcome' // OAuth overlays on welcome
  return 'welcome'
})

const showOAuth = computed(() => route.name === 'oauth')
const showPermissionDialog = ref(false)
const exiting = ref(false)

function handleLogin() {
  router.push('/oauth')
}

function handleSkip() {
  markVisited('permissions')
  router.push('/permissions')
}

function handleGrantPermissions() {
  showPermissionDialog.value = true
}

function handlePermissionCancel() {
  showPermissionDialog.value = false
}

let exitTimer: ReturnType<typeof setTimeout> | null = null

function handlePermissionComplete() {
  exiting.value = true
  exitTimer = setTimeout(() => {
    router.push('/add-site')
  }, 600)
}

onBeforeUnmount(() => {
  if (exitTimer) clearTimeout(exitTimer)
})
</script>

<template>
  <div class="onboarding-page" :class="{ 'is-windows': isWindows, 'is-exiting': exiting }">
    <!-- Window controls -->
    <WindowsTitlebar v-if="isWindows" />
    <TrafficLights v-else class="traffic-lights" />

    <!-- Accent glow (matches AddSitePage) -->
    <div class="accent-glow" />

    <!-- Split layout -->
    <div class="split">
      <!-- Left: dark panel with dot grid + morphing content -->
      <div class="split__hero">
        <DotGrid class="hero-grid" />

        <!-- Hero content crossfades -->
        <Transition name="hero-morph" mode="out-in">
          <!-- Welcome: WP logo + Studio wordmark -->
          <div v-if="step === 'welcome'" key="wp-logo" class="hero-content hero-brand">
            <WPIcon :icon="wordpress" :size="120" />
            <span class="hero-brand__label">Studio</span>
          </div>

          <!-- Permissions: lock illustration -->
          <div v-else key="lock-illus" class="hero-content illus-dialog">
            <WPIcon :icon="lock" :size="32" class="illus-dialog__lock" />
            <div class="illus-dialog__lines">
              <div class="illus-line illus-line--wide" />
              <div class="illus-line illus-line--medium" />
            </div>
            <div class="illus-dialog__field" />
            <div class="illus-dialog__buttons">
              <div class="illus-btn" />
              <div class="illus-btn illus-btn--primary" />
            </div>
          </div>
        </Transition>
      </div>

      <!-- Right: content panel with crossfading steps -->
      <div class="split__content">
        <Transition name="content-morph" mode="out-in">
          <!-- Welcome content -->
          <div v-if="step === 'welcome'" key="welcome" class="content-body">
            <div class="content-body__brand">
              <h1 class="content-body__title">{{ headline }}</h1>
              <p class="content-body__pitch">
                A full WordPress development environment on your machine.
              </p>
            </div>

            <div class="content-body__features">
              <div v-for="feature in features" :key="feature.label" class="feature-card">
                <div class="feature-card__illus">
                  <component :is="feature.illustration" />
                </div>
                <span class="feature-card__label">{{ feature.label }}</span>
                <span class="feature-card__desc">{{ feature.desc }}</span>
              </div>
            </div>

          </div>

          <!-- Permissions content -->
          <div v-else key="permissions" class="content-body">
            <div class="content-body__brand">
              <h1 class="content-body__title">Almost ready</h1>
              <p class="content-body__pitch">
                Studio needs system access to run WordPress on your machine.
              </p>
            </div>

            <div class="content-body__perms">
              <div class="perm-item">
                <WPIcon :icon="globe" :size="20" class="perm-item__icon" />
                <div class="perm-item__text">
                  <span class="perm-item__title">Custom dev URLs</span>
                  <span class="perm-item__desc">So your sites get real hostnames like <em>mysite.local</em> instead of just port numbers.</span>
                </div>
              </div>
              <div class="perm-item">
                <WPIcon :icon="connection" :size="20" class="perm-item__icon" />
                <div class="perm-item__text">
                  <span class="perm-item__title">Local network access</span>
                  <span class="perm-item__desc">Lets your browser talk to the WordPress server running on your machine.</span>
                </div>
              </div>
            </div>

          </div>
        </Transition>

        <!-- Bottom bar actions -->
        <div class="content-actions hstack gap-xs">
          <Transition name="btn-swap" mode="out-in">
            <div v-if="step === 'welcome'" key="welcome-actions" class="hstack gap-xs">
              <Button
                variant="tertiary"
                label="Skip"
                @click="handleSkip"
              />
              <Button
                variant="primary"
                label="Log in with WordPress.com"
                @click="handleLogin"
              />
            </div>
            <div v-else key="permissions-actions" class="hstack gap-s">
              <span class="actions-hint">A system dialog will appear to confirm.</span>
              <Button
                variant="primary"
                label="Request permission"
                @click="handleGrantPermissions"
              />
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- OAuth browser window popup -->
    <Transition name="popup">
      <AuthSimulation v-if="showOAuth" />
    </Transition>

    <!-- macOS permission dialog popup -->
    <Transition name="popup">
      <PermissionDialog
        v-if="showPermissionDialog"
        @cancel="handlePermissionCancel"
        @complete="handlePermissionComplete"
      />
    </Transition>
  </div>
</template>

<style scoped>
.onboarding-page {
  position: fixed;
  inset: 0;
  background: var(--color-chrome-bg);
  overflow: hidden;
}

/* ── Traffic lights (macOS) ── */

.traffic-lights {
  position: absolute;
  top: 18px; /* Physical: fixed window position */
  left: 16px; /* Physical: fixed window position */
  z-index: 100;
  -webkit-app-region: drag;
}

/* ── Windows overrides ── */

.onboarding-page.is-windows {
  display: flex;
  flex-direction: column;
}

.onboarding-page.is-windows .split {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* ── Accent glow (shared with AddSitePage) ── */

.accent-glow {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  width: 1400px;
  height: 1400px;
  background: radial-gradient(ellipse at center, var(--color-chrome-theme) 0%, transparent 60%);
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
  animation: glow-wander 20s ease-in-out infinite, glow-pulse 8s ease-in-out infinite;
}

@keyframes glow-wander {
  0% { transform: translate(-50%, -50%) translate(0, 0); }
  15% { transform: translate(-50%, -50%) translate(200px, -150px); }
  30% { transform: translate(-50%, -50%) translate(-180px, -80px); }
  50% { transform: translate(-50%, -50%) translate(120px, 180px); }
  65% { transform: translate(-50%, -50%) translate(-250px, 100px); }
  80% { transform: translate(-50%, -50%) translate(150px, -200px); }
  100% { transform: translate(-50%, -50%) translate(0, 0); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.075; }
  50% { opacity: 0.2; }
}

/* ── Split layout ── */

.split {
  position: absolute;
  inset: 0;
  display: flex;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* ── Left hero panel ── */

.split__hero {
  flex: 0 0 30%;
  position: relative;
  background: #141414;
  box-shadow: 0 0 0 1px var(--color-chrome-border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.is-exiting .split__hero {
  transform: translateX(-100%);
}

.hero-grid {
  color: rgba(255, 255, 255, 0.2);
}

.hero-content {
  position: relative;
  z-index: 2;
  color: #fff;
  pointer-events: none;
}

.hero-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxs);
}

.hero-brand__label {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
  opacity: 0.8;
}

/* ── Hero content crossfade ── */

.hero-morph-enter-active,
.hero-morph-leave-active {
  transition: opacity 300ms ease;
}

.hero-morph-enter-from,
.hero-morph-leave-to {
  opacity: 0;
}

/* ── Permissions illustration ── */

.illus-dialog {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  background: #313131;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-m);
  padding: var(--space-l) var(--space-m);
}

.illus-dialog__lock {
  opacity: 0.6;
  color: rgba(255, 255, 255, 0.8);
}

.illus-dialog__lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
}

.illus-line {
  height: 8px;
  border-radius: var(--radius-s);
  background: rgba(255, 255, 255, 0.12);
}

.illus-line--wide {
  width: 80%;
}

.illus-line--medium {
  width: 60%;
}

.illus-dialog__field {
  width: 100%;
  height: 24px;
  border-radius: var(--radius-s);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
}

.illus-dialog__buttons {
  display: flex;
  gap: var(--space-xs);
  width: 100%;
}

.illus-btn {
  flex: 1;
  height: 20px;
  border-radius: var(--radius-s);
  background: rgba(255, 255, 255, 0.12);
}

.illus-btn--primary {
  background: rgba(255, 255, 255, 0.2);
}

/* ── Right content panel ── */

.split__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-chrome-fg);
  position: relative;
  z-index: 1;
  transition: flex 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.is-exiting .split__content {
  flex: 2;
}

/* ── Content crossfade ── */

.content-morph-enter-active {
  transition: opacity 250ms ease 80ms;
}

.content-morph-leave-active {
  transition: opacity 150ms ease;
}

.content-morph-enter-from,
.content-morph-leave-to {
  opacity: 0;
}

/* ── Content body (shared between steps) ── */

.content-body {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: var(--space-xl);
  max-width: 660px;
  width: 100%;
  padding: var(--space-xl);
}


.content-body__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.content-body__title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
}

.content-body__pitch {
  font-size: var(--font-size-m);
  color: var(--color-chrome-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.content-body__features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-s);
  width: 100%;
}

.content-body__features--2col {
  grid-template-columns: repeat(2, 1fr);
}

/* ── Permissions items ── */

.content-body__perms {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  width: 100%;
}

.perm-item {
  display: flex;
  align-items: start;
  gap: var(--space-s);
}

.perm-item__icon {
  flex-shrink: 0;
  color: var(--color-chrome-fg-muted);
  margin-block-start: 2px;
}

.perm-item__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  padding-top: var(--space-xxs);
}

.perm-item__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
}

.perm-item__desc {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  line-height: 1.4;
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  border-radius: var(--radius-s);
}

.feature-card__illus {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-chrome-fill);
  border-radius: var(--radius-s);
  padding: var(--space-m);
  color: var(--color-chrome-fg);
  margin-bottom: var(--space-s);
}

.feature-card__label {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

.feature-card__desc {
  font-size: var(--font-size-m);
  color: var(--color-chrome-fg-muted);
  line-height: 1.4;
}


.actions-hint {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
}

.content-actions {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  padding: var(--space-xxxl) var(--space-xxxl);
}

/* Button crossfade in bottom bar */
.btn-swap-enter-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.btn-swap-leave-active {
  transition: opacity var(--duration-instant) var(--ease-in);
}

.btn-swap-enter-from,
.btn-swap-leave-to {
  opacity: 0;
}



/* ── Popup transitions (OAuth + permission dialog) ── */

.popup-enter-active {
  transition: opacity 250ms ease;
}

.popup-enter-active :deep(.browser-window),
.popup-enter-active :deep(.dialog-box) {
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-leave-active {
  transition: opacity 200ms ease;
}

.popup-leave-active :deep(.browser-window),
.popup-leave-active :deep(.dialog-box) {
  transition: transform 200ms ease;
}

.popup-enter-from {
  opacity: 0;
}

.popup-enter-from :deep(.browser-window),
.popup-enter-from :deep(.dialog-box) {
  transform: scale(0.9) translateY(16px);
}

.popup-leave-to {
  opacity: 0;
}

.popup-leave-to :deep(.browser-window),
.popup-leave-to :deep(.dialog-box) {
  transform: scale(0.95);
}
</style>
