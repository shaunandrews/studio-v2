<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { wordpress, check, lock } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import WindowsTitlebar from '@/components/composites/WindowsTitlebar.vue'
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

function handlePermissionComplete() {
  exiting.value = true
  setTimeout(() => {
    router.push('/all-sites')
  }, 600)
}
</script>

<template>
  <div class="onboarding-page" :class="{ 'is-windows': isWindows, 'is-exiting': exiting }">
    <!-- Window controls -->
    <WindowsTitlebar v-if="isWindows" />
    <div v-else class="traffic-lights">
      <span class="light close" />
      <span class="light minimize" />
      <span class="light maximize" />
    </div>

    <!-- Accent glow (matches AddSitePage) -->
    <div class="accent-glow" />

    <!-- Split layout -->
    <div class="split">
      <!-- Left: dark panel with dot grid + morphing content -->
      <div class="split__hero">
        <DotGrid
          rest-color="rgba(255, 255, 255, 0.1)"
          active-color="rgba(56, 88, 233, 0.9)"
        />

        <!-- Hero content crossfades -->
        <Transition name="hero-morph" mode="out-in">
          <!-- Welcome: WP logo -->
          <WPIcon
            v-if="step === 'welcome'"
            key="wp-logo"
            :icon="wordpress"
            :size="120"
            class="hero-content"
          />

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
              <h1 class="content-body__title">Welcome to<br />WordPress Studio</h1>
              <p class="content-body__pitch">
                Start by connecting your WordPress.com account to unlock the full power of Studio.
              </p>
            </div>

            <ul class="content-body__benefits">
              <li>Share preview sites with clients and colleagues</li>
              <li>Seamlessly sync with WordPress.com and Pressable</li>
              <li>Get smart suggestions from the Studio Assistant</li>
            </ul>

            <div class="content-body__actions">
              <Button
                variant="primary"
                label="Log in to WordPress.com"
                width="full"
                @click="handleLogin"
              />
              <Button
                variant="tertiary"
                label="Skip"
                width="full"
                @click="handleSkip"
              />
            </div>

            <p class="content-body__signup">
              New to WordPress.com?
              <a href="#" class="content-body__link" @click.prevent="handleLogin">Create a free account</a>
            </p>
          </div>

          <!-- Permissions content -->
          <div v-else key="permissions" class="content-body">
            <h1 class="content-body__title">Permissions needed</h1>
            <p class="content-body__pitch">You'll need to grant Studio access to:</p>

            <div class="content-body__perms">
              <div class="perm-item">
                <WPIcon :icon="check" :size="24" class="perm-item__check" />
                <div class="perm-item__text">
                  <span class="perm-item__title">Manage local URLs</span>
                  <span class="perm-item__desc">Add hostnames for your Studio sites to /etc/hosts</span>
                </div>
              </div>
              <div class="perm-item">
                <WPIcon :icon="check" :size="24" class="perm-item__check" />
                <div class="perm-item__text">
                  <span class="perm-item__title">Accept incoming network connections</span>
                  <span class="perm-item__desc">Allows you to access your sites through a browser</span>
                </div>
              </div>
            </div>

            <div class="content-body__actions">
              <Button
                variant="primary"
                label="Grant permissions"
                @click="handleGrantPermissions"
              />
            </div>
          </div>
        </Transition>
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
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: drag;
}

.light {
  width: 12px; /* OS-native size */
  height: 12px;
  border-radius: 50%;
}

.light.close { background: var(--color-macos-close); }
.light.minimize { background: var(--color-macos-minimize); }
.light.maximize { background: var(--color-macos-maximize); }

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
  opacity: 0.06;
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
  0%, 100% { opacity: 0.04; }
  50% { opacity: 0.08; }
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
  flex: 1;
  position: relative;
  background: var(--color-menu-bg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.is-exiting .split__hero {
  transform: translateX(-100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.9);
  pointer-events: none;
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
  background: #222;
  border: 1px solid #333;
  border-radius: var(--radius-m);
  padding: var(--space-l) var(--space-m);
}

.illus-dialog__lock {
  opacity: 0.7;
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
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.35);
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.3);
}

.illus-btn--primary {
  background: rgba(255, 255, 255, 0.5);
}

/* ── Right content panel ── */

.split__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
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
  align-items: flex-start;
  gap: var(--space-xl);
  max-width: 380px;
  width: 100%;
  padding: var(--space-xl);
}

.content-body__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.content-body__title {
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
}

.content-body__pitch {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.content-body__benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
}

.content-body__benefits li {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  padding-inline-start: var(--space-l);
  position: relative;
}

.content-body__benefits li::before {
  content: '✓';
  position: absolute;
  inset-inline-start: 0;
  color: var(--color-status-running);
  font-weight: var(--font-weight-semibold);
}

.content-body__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
}

.content-body__signup {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0;
}

.content-body__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.content-body__link:hover {
  text-decoration: underline;
}

/* ── Permissions items ── */

.content-body__perms {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  width: 100%;
}

.perm-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-m);
}

.perm-item__check {
  flex-shrink: 0;
  color: var(--color-status-running);
  margin-block-start: 2px;
}

.perm-item__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.perm-item__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
}

.perm-item__desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
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
