<script setup lang="ts">
import { injectSiteSettings } from '@/data/useSiteSettings'
import Checkbox from '@/components/primitives/Checkbox.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

defineProps<{
  siteId: string
}>()

const { xdebug: enableXdebug, debugLog: enableDebugLog, showErrors: showErrorsInBrowser } = injectSiteSettings()
</script>

<template>
  <SettingsSection title="Debugging">
    <Checkbox v-model="showErrorsInBrowser" label="Show errors in browsers" hint="Display PHP errors and warnings directly in the browser by setting the WP_DEBUG_DISPLAY constant." />
    <Checkbox v-model="enableDebugLog" label="Debug log" hint="Log PHP errors and warnings to a debug.log file in your site's wp-content directory by setting the WP_DEBUG_LOG constant." />
    <Checkbox v-model="enableXdebug" label="Xdebug">
      <template #hint>
        Enable PHP debugging with Xdebug. Can only be enabled on one site, and may cause slower performance. <a href="https://developer.wordpress.com/docs/developer-tools/studio/xdebug/" target="_blank" rel="noopener" class="settings__link">Learn more</a>
      </template>
    </Checkbox>
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
