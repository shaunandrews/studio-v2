<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'

const emit = defineEmits<{
  login: []
  skip: []
}>()
</script>

<template>
  <div class="welcome-screen">
    <div class="welcome-screen__content">
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
          @click="emit('login')"
        />
        <Button
          variant="tertiary"
          label="Skip"
          width="full"
          @click="emit('skip')"
        />
      </div>

      <p class="welcome-screen__signup">
        New to WordPress.com?
        <a href="#" class="welcome-screen__link" @click.prevent="emit('login')">Create a free account</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.welcome-screen__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  max-width: 400px;
  width: 100%;
  padding: var(--space-xl);
  text-align: center;
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
  color: var(--color-frame-fg);
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
  text-align: start;
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
</style>
