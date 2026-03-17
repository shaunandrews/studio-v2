<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { check } from '@wordpress/icons'
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import { useOnboarding } from '@/data/useOnboarding'

const router = useRouter()
const { markVisited, complete } = useOnboarding()

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

function handleAllow() {
  complete()
  router.push('/all-sites')
}

function handleDontAllow() {
  showDialog.value = false
}
</script>

<template>
  <div class="permission-prep">
    <div class="permission-prep__content">
      <h1 class="permission-prep__title">Permissions needed</h1>
      <p class="permission-prep__subtitle">You'll need to grant Studio access to:</p>

      <div class="permission-prep__list">
        <div
          v-for="perm in permissions"
          :key="perm.title"
          class="permission-prep__item"
        >
          <WPIcon :icon="check" :size="24" class="permission-prep__check" />
          <div class="permission-prep__item-text">
            <span class="permission-prep__item-title">{{ perm.title }}</span>
            <span class="permission-prep__item-desc">{{ perm.description }}</span>
          </div>
        </div>
      </div>

      <div class="permission-prep__actions">
        <Button
          variant="primary"
          label="Continue"
          width="full"
          @click="handleContinue"
        />
      </div>
    </div>

    <!-- Simulated macOS permission dialog -->
    <Transition name="dialog">
      <div v-if="showDialog" class="dialog-overlay">
        <div class="dialog-box">
          <div class="dialog-icon">
            <WPIcon :icon="wordpress" :size="32" />
          </div>
          <div class="dialog-body">
            <p class="dialog-title">
              "WordPress Studio" would like to administer your computer. Administration can include modifying passwords, networking, and system settings.
            </p>
            <div class="dialog-buttons">
              <button class="dialog-btn dialog-btn--cancel" @click="handleDontAllow">
                Don't Allow
              </button>
              <button class="dialog-btn dialog-btn--allow" @click="handleAllow">
                Allow
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.permission-prep {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.permission-prep__content {
  display: flex;
  flex-direction: column;
  max-width: 480px;
  width: 100%;
  padding: var(--space-xl);
}

.permission-prep__title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-s);
}

.permission-prep__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-chrome-fg-muted);
  margin: 0 0 var(--space-xl);
  line-height: 1.5;
}

.permission-prep__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  margin-block-end: var(--space-xxl);
}

.permission-prep__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-m);
}

.permission-prep__check {
  flex-shrink: 0;
  color: var(--color-status-running);
  margin-block-start: 2px;
}

.permission-prep__item-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.permission-prep__item-title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
}

.permission-prep__item-desc {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  line-height: 1.4;
}

.permission-prep__actions {
  width: 100%;
}

/* ── Simulated macOS permission dialog ── */

.dialog-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-block-start: 120px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.dialog-box {
  display: flex;
  gap: var(--space-m);
  width: 360px;
  padding: var(--space-l);
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.25),
    0 0 0 0.5px rgba(0, 0, 0, 0.1);
}

.dialog-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
  border-radius: var(--radius-m);
}

.dialog-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.dialog-title {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  margin: 0;
  line-height: 1.5;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
}

.dialog-btn {
  height: 28px;
  padding-inline: var(--space-m);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
}

.dialog-btn--cancel {
  background: var(--color-frame-fill);
  color: var(--color-frame-fg);
  border: 1px solid var(--color-frame-border);
}

.dialog-btn--cancel:hover {
  background: var(--color-frame-hover);
}

.dialog-btn--allow {
  background: var(--color-frame-theme);
  color: #fff;
}

.dialog-btn--allow:hover {
  opacity: 0.9;
}

/* ── Dialog transition ── */

.dialog-enter-active {
  transition: opacity 150ms ease;
}

.dialog-enter-active .dialog-box {
  transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-leave-active {
  transition: opacity 100ms ease;
}

.dialog-enter-from {
  opacity: 0;
}

.dialog-enter-from .dialog-box {
  transform: scale(0.95) translateY(-8px);
}

.dialog-leave-to {
  opacity: 0;
}
</style>
