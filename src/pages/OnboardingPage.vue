<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import WindowsTitlebar from '@/components/composites/WindowsTitlebar.vue'
import DotGrid from '@/components/features/onboarding/DotGrid.vue'
import { useOnboarding } from '@/data/useOnboarding'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import AuthSimulation from '@/components/features/onboarding/AuthSimulation.vue'
import PermissionFlow from '@/components/features/onboarding/PermissionFlow.vue'

const route = useRoute()
const router = useRouter()
const { markVisited } = useOnboarding()
const { isWindows } = useOperatingSystem()

markVisited('welcome')

const showOAuth = computed(() => route.name === 'oauth')
const showPermissions = computed(() => route.name === 'permissions')

function handleLogin() {
  router.push('/oauth')
}

function handleSkip() {
  router.push('/permissions')
}
</script>

<template>
  <div class="onboarding-page" :class="{ 'is-windows': isWindows }">
    <!-- Window controls -->
    <WindowsTitlebar v-if="isWindows" />
    <div v-else class="traffic-lights">
      <span class="light close" />
      <span class="light minimize" />
      <span class="light maximize" />
    </div>

    <!-- Welcome screen: always visible as the base layer -->
    <div class="welcome-screen">
      <!-- Left: dark panel with interactive dot grid -->
      <div class="welcome-screen__hero">
        <DotGrid
          rest-color="rgba(255, 255, 255, 0.1)"
          active-color="rgba(56, 88, 233, 0.9)"
        />
        <WPIcon :icon="wordpress" :size="48" class="welcome-screen__wp-mark" />
      </div>

      <!-- Right: content -->
      <div class="welcome-screen__content">
        <div class="welcome-screen__body">
          <div class="welcome-screen__brand">
            <h1 class="welcome-screen__title">Welcome to<br />WordPress Studio</h1>
            <p class="welcome-screen__pitch">
              Start by connecting your WordPress.com account to unlock the full power of Studio.
            </p>
          </div>

          <ul class="welcome-screen__benefits">
            <li>Share preview sites with clients and colleagues</li>
            <li>Seamlessly sync with WordPress.com and Pressable</li>
            <li>Get smart suggestions from the Studio Assistant</li>
          </ul>

          <div class="welcome-screen__actions">
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

          <p class="welcome-screen__signup">
            New to WordPress.com?
            <a href="#" class="welcome-screen__link" @click.prevent="handleLogin">Create a free account</a>
          </p>
        </div>
      </div>
    </div>

    <!-- OAuth browser window overlay -->
    <Transition name="popup">
      <AuthSimulation v-if="showOAuth" />
    </Transition>

    <!-- Permission prep + macOS dialog overlay -->
    <Transition name="popup">
      <PermissionFlow v-if="showPermissions" />
    </Transition>
  </div>
</template>

<style scoped>
.onboarding-page {
  position: fixed;
  inset: 0;
  background: var(--color-chrome-bg);
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

.onboarding-page.is-windows .welcome-screen {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* ── Welcome screen: split layout ── */

.welcome-screen {
  position: absolute;
  inset: 0;
  display: flex;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* ── Left hero panel ── */

.welcome-screen__hero {
  flex: 1;
  position: relative;
  background: var(--color-menu-bg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-screen__wp-mark {
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.9);
  pointer-events: none;
}

/* ── Right content panel ── */

.welcome-screen__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
}

.welcome-screen__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xl);
  max-width: 380px;
  width: 100%;
  padding: var(--space-xl);
}

.welcome-screen__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.welcome-screen__title {
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
}

.welcome-screen__pitch {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.welcome-screen__benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
}

.welcome-screen__benefits li {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  padding-inline-start: var(--space-l);
  position: relative;
}

.welcome-screen__benefits li::before {
  content: '✓';
  position: absolute;
  inset-inline-start: 0;
  color: var(--color-status-running);
  font-weight: var(--font-weight-semibold);
}

.welcome-screen__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
}

.welcome-screen__signup {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0;
}

.welcome-screen__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.welcome-screen__link:hover {
  text-decoration: underline;
}

/* ── Popup overlay transition ── */

.popup-enter-active {
  transition: opacity 200ms ease;
}

.popup-enter-active :deep(.browser-window),
.popup-enter-active :deep(.dialog-box) {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-leave-active {
  transition: opacity 150ms ease;
}

.popup-leave-active :deep(.browser-window),
.popup-leave-active :deep(.dialog-box) {
  transition: transform 150ms ease;
}

.popup-enter-from {
  opacity: 0;
}

.popup-enter-from :deep(.browser-window),
.popup-enter-from :deep(.dialog-box) {
  transform: scale(0.92) translateY(12px);
}

.popup-leave-to {
  opacity: 0;
}

.popup-leave-to :deep(.browser-window),
.popup-leave-to :deep(.dialog-box) {
  transform: scale(0.96);
}
</style>
