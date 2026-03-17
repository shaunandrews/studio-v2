<script setup lang="ts">
import { ref } from 'vue'
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { useOnboarding } from '@/data/useOnboarding'

const { complete } = useOnboarding()

const emit = defineEmits<{
  cancel: []
  complete: []
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
  emit('complete')
}
</script>

<template>
  <div class="permission-overlay">
    <div class="dialog-box">
      <!-- Lock + app icon -->
      <div class="dialog-icon-stack">
        <svg class="dialog-lock" viewBox="0 0 40 52" width="40" height="52" fill="none">
          <!-- Shackle -->
          <path d="M12 22V16a8 8 0 0 1 16 0v6" stroke="#9a9a9a" stroke-width="3" stroke-linecap="round" />
          <path d="M12 22V16a8 8 0 0 1 16 0v6" stroke="url(#shackle-grad)" stroke-width="2.5" stroke-linecap="round" />
          <!-- Body -->
          <rect x="4" y="22" width="32" height="26" rx="3" fill="url(#body-grad)" />
          <rect x="5" y="23" width="30" height="24" rx="2.5" fill="url(#body-face)" />
          <!-- Keyhole -->
          <circle cx="20" cy="34" r="2.5" fill="#6b5a28" />
          <rect x="19" y="35.5" width="2" height="4" rx="0.5" fill="#6b5a28" />
          <defs>
            <linearGradient id="shackle-grad" x1="12" y1="8" x2="12" y2="22">
              <stop offset="0%" stop-color="#c8c8c8" />
              <stop offset="100%" stop-color="#8a8a8a" />
            </linearGradient>
            <linearGradient id="body-grad" x1="4" y1="22" x2="4" y2="48">
              <stop offset="0%" stop-color="#d4a832" />
              <stop offset="100%" stop-color="#b8922a" />
            </linearGradient>
            <linearGradient id="body-face" x1="5" y1="23" x2="5" y2="47">
              <stop offset="0%" stop-color="#f2d56c" />
              <stop offset="100%" stop-color="#d4a832" />
            </linearGradient>
          </defs>
        </svg>
        <div class="dialog-app-icon">
          <WPIcon :icon="wordpress" :size="20" />
        </div>
      </div>

      <!-- Title -->
      <h2 class="dialog-title">
        <strong>"WordPress Studio"</strong> wants to make changes.
      </h2>
      <p class="dialog-subtitle">
        Enter your password to allow this.
      </p>

      <!-- Fields: stacked label + input -->
      <div class="dialog-fields">
        <div class="dialog-field">
          <label class="dialog-field__label">User Name</label>
          <input
            class="dialog-field__input"
            type="text"
            value="Shaun Andrews"
            readonly
          />
        </div>
        <div class="dialog-field">
          <label class="dialog-field__label">Password</label>
          <input
            v-model="password"
            class="dialog-field__input"
            type="password"
            autofocus
          />
        </div>
      </div>

      <!-- Full-width buttons -->
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn--cancel" @click="handleCancel">
          Cancel
        </button>
        <button
          class="dialog-btn dialog-btn--ok"
          :disabled="isAuthenticating"
          @click="handleOK"
        >
          OK
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
  padding-block-start: 100px;
  z-index: 60;
}

.dialog-box {
  width: 260px;
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.3),
    0 0 0 0.5px rgba(0, 0, 0, 0.12);
  padding: var(--space-l) var(--space-l) var(--space-m);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* ── Lock icon with app badge ── */

.dialog-icon-stack {
  position: relative;
  width: 40px;
  height: 52px;
  margin-block-end: var(--space-m);
}

.dialog-lock {
  display: block;
}

.dialog-app-icon {
  position: absolute;
  inset-block-end: -2px;
  inset-inline-end: -10px;
  width: 24px;
  height: 24px;
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

/* ── Text ── */

.dialog-title {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
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

/* ── Form fields: stacked label + input ── */

.dialog-fields {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  margin-block-end: var(--space-l);
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.dialog-field__label {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  font-weight: var(--font-weight-medium);
}

.dialog-field__input {
  width: 100%;
  height: 28px;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-size: var(--font-size-s);
  font-family: var(--font-family);
  outline: none;
  box-sizing: border-box;
}

.dialog-field__input:focus {
  border-color: var(--color-frame-theme);
  box-shadow: 0 0 0 3px rgba(56, 88, 233, 0.25);
}

.dialog-field__input[readonly] {
  background: var(--color-frame-fill);
  color: var(--color-frame-fg-muted);
}

/* ── Full-width buttons ── */

.dialog-buttons {
  display: flex;
  gap: var(--space-xs);
  width: 100%;
}

.dialog-btn {
  flex: 1;
  height: 32px;
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

.dialog-btn--ok {
  background: var(--color-frame-theme);
  color: #fff;
}

.dialog-btn--ok:hover {
  opacity: 0.9;
}

.dialog-btn--ok:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
