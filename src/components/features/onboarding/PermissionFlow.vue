<script setup lang="ts">
import { ref } from 'vue'
import { check } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
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
    <!-- Full-screen prep content -->
    <div class="permission-screen">
      <div class="permission-screen__content">
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
            label="Continue"
            width="full"
            @click="handleContinue"
          />
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

/* ── Full-screen permissions prep ── */

.permission-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.permission-screen__content {
  display: flex;
  flex-direction: column;
  max-width: 480px;
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
  color: var(--color-chrome-fg-muted);
  margin: 0 0 var(--space-xl);
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
  color: var(--color-chrome-fg-muted);
  line-height: 1.4;
}

.permission-screen__actions {
  width: 100%;
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
