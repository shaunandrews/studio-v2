<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '@/components/primitives/Button.vue'
import { useOnboarding } from '@/data/useOnboarding'

const router = useRouter()
const { markVisited, complete } = useOnboarding()

markVisited('permissions')

function handleContinue() {
  // Simulate a system permission dialog
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
      <div class="permission-prep__icon">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2" />
          <path d="M4 16h40" stroke="currentColor" stroke-width="2" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" />
          <circle cx="22" cy="12" r="1.5" fill="currentColor" />
          <path d="M16 28l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h2 class="permission-prep__title">Studio needs access to your files</h2>
      <p class="permission-prep__description">
        To create and manage WordPress sites on your computer, Studio needs permission to read and write files in your projects folder.
      </p>

      <ul class="permission-prep__details">
        <li>Create local WordPress installations</li>
        <li>Manage themes, plugins, and site files</li>
        <li>Import and export site backups</li>
      </ul>

      <div class="permission-prep__actions">
        <Button
          variant="primary"
          label="Continue"
          width="full"
          @click="handleContinue"
        />
      </div>

      <p class="permission-prep__note">
        You can change these permissions later in System Settings.
      </p>
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
  align-items: center;
  gap: var(--space-l);
  max-width: 400px;
  width: 100%;
  padding: var(--space-xl);
  text-align: center;
}

.permission-prep__icon {
  color: var(--color-frame-fg-muted);
}

.permission-prep__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.permission-prep__description {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.permission-prep__details {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  text-align: start;
  width: 100%;
}

.permission-prep__details li {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  padding-inline-start: var(--space-l);
  position: relative;
}

.permission-prep__details li::before {
  content: '•';
  position: absolute;
  inset-inline-start: var(--space-xs);
  color: var(--color-frame-fg-muted);
}

.permission-prep__actions {
  width: 100%;
}

.permission-prep__note {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  margin: 0;
  opacity: 0.7;
}
</style>
