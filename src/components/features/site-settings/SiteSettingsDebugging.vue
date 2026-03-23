<script setup lang="ts">
import { ref } from 'vue'
import Toggle from '@/components/primitives/Toggle.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

defineProps<{
  siteId: string
}>()

const enableXdebug = ref(false)
const enableDebugLog = ref(false)
const showErrorsInBrowser = ref(false)
</script>

<template>
  <SettingsSection title="Debugging">
    <Toggle v-model="showErrorsInBrowser" label="Show errors in browsers" size="small" hint="Display PHP errors and warnings directly in the browser by setting the WP_DEBUG_DISPLAY constant." />
    <Toggle v-model="enableDebugLog" label="Debug log" size="small" hint="Log PHP errors and warnings to a debug.log file in your site's wp-content directory by setting the WP_DEBUG_LOG constant." />
    <Toggle v-model="enableXdebug" label="Xdebug" size="small">
      <template #hint>
        Enable PHP debugging with Xdebug. Can only be enabled on one site, and may cause slower performance. <a href="https://developer.wordpress.com/docs/developer-tools/studio/xdebug/" target="_blank" rel="noopener" class="settings__link">Learn more</a>
      </template>
    </Toggle>
  </SettingsSection>
</template>

<style scoped>
.settings__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.settings__link:hover {
  text-decoration: underline;
}
</style>
