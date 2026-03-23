<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSites } from '@/data/useSites'
import { skills } from '@/data/skills'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import SiteSkillsModal from '@/components/features/SiteSkillsModal.vue'
import SettingsSection from '@/components/composites/SettingsSection.vue'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  'manage-global-skills': []
}>()

const { sites, updateSite } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

const showSkillsModal = ref(false)
const overrides = computed(() => site.value?.skillOverrides ?? {})

function resetSkillOverrides() {
  if (!site.value) return
  updateSite(site.value.id, { skillOverrides: undefined })
}

const overrideEntries = computed(() => {
  return Object.entries(overrides.value).map(([id, state]) => {
    const skill = skills.find(s => s.id === id)
    return { id, state, name: skill?.name ?? id }
  })
})
</script>

<template>
  <SettingsSection title="Site skills">
    <div class="skills__layout" :class="{ 'skills__layout--empty': !overrideEntries.length }">
      <div class="skills__content">
        <Text variant="body-small" color="muted">
          Your task agents make use of skills you've installed in <button class="settings__link-btn" @click="emit('manage-global-skills')">Studio Settings</button>.<template v-if="overrideEntries.length"> This site has the following skill overrides:</template><template v-else> You can override global skills for this site.</template>
        </Text>

        <div v-if="overrideEntries.length" class="skills__overrides">
          <Tooltip
            v-for="entry in overrideEntries"
            :key="entry.id"
            :text="entry.state === 'enabled' ? 'Installed on this site' : 'Uninstalled on this site'"
          >
            <span
              class="skills__override-pill"
              :class="entry.state === 'enabled' ? 'skills__override-pill--added' : 'skills__override-pill--removed'"
            >
              {{ entry.name }}
            </span>
          </Tooltip>
        </div>

        <div class="skills__actions">
          <Button variant="secondary" size="small" label="Manage site skills" @click="showSkillsModal = true" />
          <Button v-if="overrideEntries.length" variant="tertiary" size="small" label="Reset to global" @click="resetSkillOverrides" />
        </div>
      </div>

      <svg v-if="!overrideEntries.length" class="skills__illustration" width="110" height="80" viewBox="0 0 110 80" fill="none" aria-hidden="true">
        <g transform="rotate(-3 40 14)">
          <rect x="8" y="8" width="40" height="14" rx="4" fill="#b8e6bf" opacity="0.5" />
        </g>
        <g transform="rotate(4 88 12)">
          <rect x="56" y="4" width="32" height="14" rx="4" fill="#f2d76b" opacity="0.35" />
          <line x1="62" y1="11" x2="82" y2="11" stroke="var(--color-frame-fg)" stroke-width="1" opacity="0.15" stroke-linecap="round" />
        </g>
        <g transform="rotate(2 24 36)">
          <rect x="0" y="30" width="34" height="14" rx="4" fill="#f2d76b" opacity="0.3" />
          <line x1="6" y1="37" x2="28" y2="37" stroke="var(--color-frame-fg)" stroke-width="1" opacity="0.12" stroke-linecap="round" />
        </g>
        <g transform="rotate(-2 68 36)">
          <rect x="40" y="28" width="44" height="14" rx="4" fill="#b8e6bf" opacity="0.55" />
        </g>
        <g transform="rotate(5 30 58)">
          <rect x="14" y="52" width="36" height="14" rx="4" fill="#b8e6bf" opacity="0.35" />
        </g>
        <g transform="rotate(-4 82 58)">
          <rect x="58" y="50" width="40" height="14" rx="4" fill="#f2d76b" opacity="0.25" />
          <line x1="64" y1="57" x2="92" y2="57" stroke="var(--color-frame-fg)" stroke-width="1" opacity="0.1" stroke-linecap="round" />
        </g>
      </svg>
    </div>

    <SiteSkillsModal :open="showSkillsModal" :site-id="siteId" @close="showSkillsModal = false" />
  </SettingsSection>
</template>

<style scoped>
.skills__layout--empty {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.skills__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  flex: 1;
  min-width: 0;
}

.skills__illustration {
  flex-shrink: 0;
  margin-inline-start: var(--space-m);
}

.settings__link-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: var(--color-frame-theme);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.settings__link-btn:hover {
  text-decoration: none;
}

.skills__actions {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.skills__overrides {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxs);
}

.skills__override-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xxxs) var(--space-xs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
}

.skills__override-pill--added {
  background: rgba(184, 230, 191, 0.45);
}

.skills__override-pill--removed {
  background: rgba(242, 215, 107, 0.35);
  text-decoration: line-through;
}
</style>
