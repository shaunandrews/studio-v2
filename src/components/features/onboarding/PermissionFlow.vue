<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { check } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import PermissionDialog from './PermissionDialog.vue'
import { useOnboarding } from '@/data/useOnboarding'

const router = useRouter()
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
    <!-- Prep screen: explains what permissions are needed -->
    <div class="prep-overlay">
      <div class="prep-card">
        <h1 class="prep-card__title">Permissions needed</h1>
        <p class="prep-card__subtitle">You'll need to grant Studio access to:</p>

        <div class="prep-card__list">
          <div
            v-for="perm in permissions"
            :key="perm.title"
            class="prep-card__item"
          >
            <WPIcon :icon="check" :size="24" class="prep-card__check" />
            <div class="prep-card__item-text">
              <span class="prep-card__item-title">{{ perm.title }}</span>
              <span class="prep-card__item-desc">{{ perm.description }}</span>
            </div>
          </div>
        </div>

        <div class="prep-card__actions">
          <Button
            variant="primary"
            label="Continue"
            width="full"
            @click="handleContinue"
          />
        </div>
      </div>
    </div>

    <!-- macOS permission dialog: layers on top of prep screen -->
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

/* ── Prep overlay ── */

.prep-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
}

.prep-card {
  width: 480px;
  max-width: 90vw;
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--space-xxl);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.prep-card__title {
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0 0 var(--space-xs);
}

.prep-card__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0 0 var(--space-xl);
  line-height: 1.5;
}

.prep-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  margin-block-end: var(--space-xl);
}

.prep-card__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-m);
}

.prep-card__check {
  flex-shrink: 0;
  color: var(--color-status-running);
  margin-block-start: 2px;
}

.prep-card__item-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.prep-card__item-title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.prep-card__item-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

.prep-card__actions {
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
