<script setup lang="ts">
import { ref } from 'vue'
import { check, lock } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import DotGrid from './DotGrid.vue'
import PermissionDialog from './PermissionDialog.vue'
import { useOnboarding } from '@/data/useOnboarding'

const { markVisited } = useOnboarding()

markVisited('permissions')

const showDialog = ref(false)

const permissions = [
  {
    title: 'Manage local URLs',
    description: 'Add hostnames for your Studio sites to /etc/hosts',
  },
  {
    title: 'Accept incoming network connections',
    description: 'Allows you to access your sites through a browser',
  },
]

function handleContinue() {
  showDialog.value = true
}

function handleCancel() {
  showDialog.value = false
}
</script>

<template>
  <div class="permission-flow">
    <!-- Full-screen split layout -->
    <div class="permission-screen">
      <!-- Left: dark panel with dot grid + illustration -->
      <div class="permission-screen__hero">
        <DotGrid
          rest-color="rgba(255, 255, 255, 0.1)"
          active-color="rgba(56, 88, 233, 0.9)"
        />
        <div class="permission-screen__illustration">
          <div class="illus-dialog">
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
        </div>
      </div>

      <!-- Right: content -->
      <div class="permission-screen__content">
        <div class="permission-screen__body">
          <h1 class="permission-screen__title">Permissions needed</h1>
          <p class="permission-screen__subtitle">You'll need to grant Studio access to:</p>

          <div class="permission-screen__list">
            <div
              v-for="perm in permissions"
              :key="perm.title"
              class="permission-screen__item"
            >
              <WPIcon :icon="check" :size="24" class="permission-screen__check" />
              <div class="permission-screen__item-text">
                <span class="permission-screen__item-title">{{ perm.title }}</span>
                <span class="permission-screen__item-desc">{{ perm.description }}</span>
              </div>
            </div>
          </div>

          <div class="permission-screen__actions">
            <Button
              variant="primary"
              label="Grant permissions"
              @click="handleContinue"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- macOS permission dialog floats on top -->
    <Transition name="dialog">
      <PermissionDialog v-if="showDialog" @cancel="handleCancel" />
    </Transition>
  </div>
</template>

<style scoped>
.permission-flow {
  position: fixed;
  inset: 0;
  z-index: 50;
}

/* ── Split layout ── */

.permission-screen {
  position: absolute;
  inset: 0;
  display: flex;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* ── Left hero panel ── */

.permission-screen__hero {
  flex: 1;
  position: relative;
  background: var(--color-menu-bg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Illustration: stylized macOS permission dialog ── */

.permission-screen__illustration {
  position: relative;
  z-index: 1;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illus-dialog {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
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

.permission-screen__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
}

.permission-screen__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 380px;
  width: 100%;
  padding: var(--space-xl);
}

.permission-screen__title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-s);
}

.permission-screen__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0 0 var(--space-xxl);
  line-height: 1.5;
}

.permission-screen__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  margin-block-end: var(--space-xxl);
}

.permission-screen__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-m);
}

.permission-screen__check {
  flex-shrink: 0;
  color: var(--color-status-running);
  margin-block-start: 2px;
}

.permission-screen__item-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.permission-screen__item-title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
}

.permission-screen__item-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

/* ── Dialog transition ── */

.dialog-enter-active {
  transition: opacity 200ms ease;
}

.dialog-enter-active :deep(.dialog-box) {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-leave-active {
  transition: opacity 150ms ease;
}

.dialog-leave-active :deep(.dialog-box) {
  transition: transform 150ms ease;
}

.dialog-enter-from {
  opacity: 0;
}

.dialog-enter-from :deep(.dialog-box) {
  transform: scale(0.92) translateY(-8px);
}

.dialog-leave-to {
  opacity: 0;
}

.dialog-leave-to :deep(.dialog-box) {
  transform: scale(0.96);
}
</style>
