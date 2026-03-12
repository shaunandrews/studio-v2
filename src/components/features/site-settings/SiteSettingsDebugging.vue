<script setup lang="ts">
import { ref } from 'vue'
import Toggle from '@/components/primitives/Toggle.vue'

defineProps<{
  siteId: string
}>()

const enableXdebug = ref(false)
const enableDebugLog = ref(false)
const showErrorsInBrowser = ref(false)
</script>

<template>
  <section class="settings__section">
    <h3 class="settings__section-title">Debugging</h3>
    <div class="settings__card">
      <Toggle v-model="showErrorsInBrowser" label="Show errors in browsers" size="small" hint="Display PHP errors and warnings directly in the browser by setting the WP_DEBUG_DISPLAY constant." />
      <Toggle v-model="enableDebugLog" label="Debug log" size="small" hint="Log PHP errors and warnings to a debug.log file in your site's wp-content directory by setting the WP_DEBUG_LOG constant." />
      <Toggle v-model="enableXdebug" label="Xdebug" size="small">
        <template #hint>
          Enable PHP debugging with Xdebug. Can only be enabled on one site, and may cause slower performance. <a href="https://developer.wordpress.com/docs/developer-tools/studio/xdebug/" target="_blank" rel="noopener" class="settings__link">Learn more</a>
        </template>
      </Toggle>
    </div>
  </section>
</template>

<style scoped>
.settings__section {
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: clip;
}

.settings__section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
  padding: var(--space-s) var(--space-m);
}

.settings__card {
  background: var(--color-frame-bg);
  border-block-start: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.07);
  padding: var(--space-m);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.settings__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.settings__link:hover {
  text-decoration: underline;
}
</style>
