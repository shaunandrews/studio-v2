<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { useOnboarding } from '@/data/useOnboarding'

const router = useRouter()
const { complete } = useOnboarding()

const emit = defineEmits<{
  cancel: []
}>()

const password = ref('••••••••')
const isAuthenticating = ref(false)

function handleCancel() {
  emit('cancel')
}

async function handleOK() {
  isAuthenticating.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  isAuthenticating.value = false
  complete()
  router.push('/all-sites')
}
</script>

<template>
  <div class="permission-overlay">
    <div class="dialog-box">
      <!-- Lock + app icon -->
      <div class="dialog-icon-stack">
        <div class="dialog-lock">
          <svg viewBox="0 0 32 32" width="48" height="48">
            <!-- Lock body -->
            <rect x="6" y="14" width="20" height="15" rx="2" fill="#c8a84e" />
            <rect x="7" y="15" width="18" height="13" rx="1.5" fill="url(#lock-gradient)" />
            <!-- Lock shackle -->
            <path d="M10 14V10a6 6 0 0 1 12 0v4" fill="none" stroke="#8a8a8a" stroke-width="2.5" stroke-linecap="round" />
            <path d="M10 14V10a6 6 0 0 1 12 0v4" fill="none" stroke="url(#shackle-gradient)" stroke-width="2" stroke-linecap="round" />
            <!-- Keyhole -->
            <circle cx="16" cy="21" r="2" fill="#5a4a20" />
            <rect x="15" y="22" width="2" height="3" rx="0.5" fill="#5a4a20" />
            <defs>
              <linearGradient id="lock-gradient" x1="7" y1="15" x2="7" y2="28">
                <stop offset="0%" stop-color="#f0d56c" />
                <stop offset="100%" stop-color="#c8a84e" />
              </linearGradient>
              <linearGradient id="shackle-gradient" x1="10" y1="6" x2="10" y2="14">
                <stop offset="0%" stop-color="#c0c0c0" />
                <stop offset="100%" stop-color="#9a9a9a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="dialog-app-icon">
          <WPIcon :icon="wordpress" :size="20" />
        </div>
      </div>

      <!-- Text -->
      <p class="dialog-title">
        <strong>"WordPress Studio"</strong> wants to make changes.
      </p>
      <p class="dialog-subtitle">
        Enter your password to allow this.
      </p>

      <!-- Password fields -->
      <div class="dialog-fields">
        <div class="dialog-field">
          <label class="dialog-field__label">User Name:</label>
          <input
            class="dialog-field__input"
            type="text"
            value="Shaun Andrews"
            readonly
          />
        </div>
        <div class="dialog-field">
          <label class="dialog-field__label">Password:</label>
          <input
            v-model="password"
            class="dialog-field__input dialog-field__input--password"
            type="password"
          />
        </div>
      </div>

      <!-- Buttons -->
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn--cancel" @click="handleCancel">
          Cancel
        </button>
        <button
          class="dialog-btn dialog-btn--ok"
          :disabled="isAuthenticating"
          @click="handleOK"
        >
          {{ isAuthenticating ? 'OK' : 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permission-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-block-start: 140px;
  z-index: 60;
}

.dialog-box {
  width: 340px;
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.3),
    0 0 0 0.5px rgba(0, 0, 0, 0.12);
  padding: var(--space-l) var(--space-xl) var(--space-l);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* ── Lock icon with app badge ── */

.dialog-icon-stack {
  position: relative;
  margin-block-end: var(--space-m);
}

.dialog-lock {
  width: 48px;
  height: 48px;
}

.dialog-app-icon {
  position: absolute;
  inset-block-end: -4px;
  inset-inline-end: -8px;
  width: 24px;
  height: 24px;
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* ── Text ── */

.dialog-title {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  margin: 0 0 var(--space-xxs);
  text-align: center;
  line-height: 1.4;
}

.dialog-subtitle {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0 0 var(--space-l);
  text-align: center;
}

/* ── Form fields ── */

.dialog-fields {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-block-end: var(--space-l);
}

.dialog-field {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.dialog-field__label {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  white-space: nowrap;
  width: 88px;
  text-align: end;
  flex-shrink: 0;
}

.dialog-field__input {
  flex: 1;
  height: 24px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: 4px;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-size: var(--font-size-s);
  font-family: var(--font-family);
  outline: none;
}

.dialog-field__input:focus {
  border-color: var(--color-frame-theme);
  box-shadow: 0 0 0 2px rgba(56, 88, 233, 0.3);
}

.dialog-field__input[readonly] {
  background: var(--color-frame-fill);
  color: var(--color-frame-fg-muted);
}

/* ── Buttons (macOS style: right-aligned, Cancel + OK) ── */

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
  width: 100%;
}

.dialog-btn {
  height: 24px;
  padding-inline: var(--space-m);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  line-height: 1;
}

.dialog-btn--cancel {
  background: var(--color-frame-fill);
  color: var(--color-frame-fg);
  border: 1px solid var(--color-frame-border);
}

.dialog-btn--cancel:hover {
  background: var(--color-frame-hover);
}

.dialog-btn--ok {
  background: var(--color-frame-theme);
  color: #fff;
  min-width: 64px;
}

.dialog-btn--ok:hover {
  opacity: 0.9;
}

.dialog-btn--ok:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
