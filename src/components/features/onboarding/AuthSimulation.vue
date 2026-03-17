<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/primitives/Button.vue'
import { useAuth } from '@/data/useAuth'

const emit = defineEmits<{
  complete: []
}>()

const { login } = useAuth()

const email = ref('user@example.com')
const password = ref('••••••••')
const isLoading = ref(false)

async function handleLogin() {
  isLoading.value = true
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  login({
    name: 'Studio User',
    email: email.value,
    avatar: 'https://gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=64',
  })
  isLoading.value = false
  emit('complete')
}
</script>

<template>
  <div class="auth-simulation">
    <div class="auth-simulation__backdrop" />
    <div class="auth-simulation__modal">
      <div class="auth-simulation__header">
        <svg class="auth-simulation__logo" viewBox="0 0 24 24" width="36" height="36">
          <circle cx="12" cy="12" r="12" fill="#0675C4" />
          <path d="M12 3.3c-4.8 0-8.7 3.9-8.7 8.7 0 4.8 3.9 8.7 8.7 8.7 4.8 0 8.7-3.9 8.7-8.7 0-4.8-3.9-8.7-8.7-8.7zm-1.2 13.4L7 12.9l1.2-2.7 2.1 1 3.5-7.1 1.5 2.8-4.5 7.8z" fill="white" />
        </svg>
        <h2 class="auth-simulation__title">Log in to WordPress.com</h2>
      </div>

      <div class="auth-simulation__form">
        <label class="auth-simulation__field">
          <span class="auth-simulation__label">Email address</span>
          <input
            v-model="email"
            type="email"
            class="auth-simulation__input"
            placeholder="you@example.com"
          />
        </label>
        <label class="auth-simulation__field">
          <span class="auth-simulation__label">Password</span>
          <input
            v-model="password"
            type="password"
            class="auth-simulation__input"
          />
        </label>

        <Button
          variant="primary"
          :label="isLoading ? 'Logging in...' : 'Log in'"
          width="full"
          :disabled="isLoading"
          @click="handleLogin"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-simulation {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.auth-simulation__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.auth-simulation__modal {
  position: relative;
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  padding: var(--space-xxl);
  width: 380px;
  max-width: 90vw;
}

.auth-simulation__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  margin-block-end: var(--space-xl);
}

.auth-simulation__title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.auth-simulation__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.auth-simulation__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.auth-simulation__label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.auth-simulation__input {
  height: 40px;
  padding: 0 var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-size: var(--font-size-m);
  font-family: var(--font-family);
  outline: none;
  transition: border-color 150ms ease;
}

.auth-simulation__input:focus {
  border-color: var(--color-frame-theme);
}
</style>
