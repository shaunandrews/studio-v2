<script setup lang="ts">
import { useRouter } from 'vue-router'
import { check } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import { useOnboarding } from '@/data/useOnboarding'

const router = useRouter()
const { markVisited, complete } = useOnboarding()

markVisited('permissions')

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
  const granted = window.confirm(
    'WordPress Studio wants to access files on your computer to create and manage WordPress sites.\n\nAllow access?'
  )
  if (granted) {
    complete()
    router.push('/all-sites')
  }
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
  </div>
</template>

<style scoped>
.permission-prep {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
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
  color: var(--color-frame-fg);
  margin: 0 0 var(--space-s);
}

.permission-prep__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
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
  color: var(--color-frame-fg);
}

.permission-prep__item-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

.permission-prep__actions {
  width: 100%;
}
</style>
