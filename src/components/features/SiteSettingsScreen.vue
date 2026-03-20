<script setup lang="ts">
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import SiteSettingsGeneral from '@/components/features/site-settings/SiteSettingsGeneral.vue'
import SiteSettingsAdmin from '@/components/features/site-settings/SiteSettingsAdmin.vue'
import SiteSettingsSkills from '@/components/features/site-settings/SiteSettingsSkills.vue'
import SiteSettingsDebugging from '@/components/features/site-settings/SiteSettingsDebugging.vue'
import SiteSettingsActions from '@/components/features/site-settings/SiteSettingsActions.vue'
import ImportExportScreen from '@/components/features/ImportExportScreen.vue'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  'manage-global-skills': []
}>()
</script>

<template>
  <ScreenLayout scrollable>
    <SiteSettingsGeneral :site-id="siteId" />
    <SiteSettingsAdmin :site-id="siteId" />
    <SiteSettingsSkills :site-id="siteId" @manage-global-skills="emit('manage-global-skills')" />
    <SiteSettingsDebugging :site-id="siteId" />
    <ImportExportScreen :site-id="siteId" />
    <SiteSettingsActions :site-id="siteId" />
  </ScreenLayout>
</template>

<style scoped>
:deep(.settings__section + .settings__section) {
  margin-block-start: var(--space-m);
}
</style>
