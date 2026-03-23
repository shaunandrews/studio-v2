<script setup lang="ts">
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import SiteSettingsGeneral from '@/components/features/site-settings/SiteSettingsGeneral.vue'
import SiteSettingsAdmin from '@/components/features/site-settings/SiteSettingsAdmin.vue'
import SiteSettingsSkills from '@/components/features/site-settings/SiteSettingsSkills.vue'
import SiteSettingsDebugging from '@/components/features/site-settings/SiteSettingsDebugging.vue'
import SiteSettingsImport from '@/components/features/site-settings/SiteSettingsImport.vue'
import SiteSettingsExport from '@/components/features/site-settings/SiteSettingsExport.vue'
import SiteSettingsActions from '@/components/features/site-settings/SiteSettingsActions.vue'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  'manage-global-skills': []
}>()
</script>

<template>
  <ScreenLayout scrollable>
    <div class="settings-sections">
      <SiteSettingsGeneral :site-id="siteId" />
      <SiteSettingsAdmin :site-id="siteId" />
      <SiteSettingsSkills :site-id="siteId" @manage-global-skills="emit('manage-global-skills')" />
      <SiteSettingsDebugging :site-id="siteId" />
      <SiteSettingsImport :site-id="siteId" />
      <SiteSettingsExport :site-id="siteId" />
      <SiteSettingsActions :site-id="siteId" />
    </div>
  </ScreenLayout>
</template>

<style scoped>
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}
</style>
