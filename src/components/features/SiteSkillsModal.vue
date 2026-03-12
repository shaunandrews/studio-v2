<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSites } from '@/data/useSites'
import { skills } from '@/data/skills'
import type { Skill } from '@/data/skills'
import Badge from '@/components/primitives/Badge.vue'
import Button from '@/components/primitives/Button.vue'
import Modal from '@/components/primitives/Modal.vue'
import Text from '@/components/primitives/Text.vue'

const props = defineProps<{
  open: boolean
  siteId: string
  /** Render inline without scrim — for design overviews */
  embedded?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { sites, updateSite } = useSites()
const site = computed(() => sites.value.find(s => s.id === props.siteId))

// Local draft of overrides — committed on Save
const draft = ref<Record<string, 'enabled' | 'disabled'>>({})

// Reset draft when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    draft.value = { ...(site.value?.skillOverrides ?? {}) }
  }
})

const globalSkills = computed(() => skills.filter(s => s.installed))

// Installed on this site = global skills (minus disabled) + site-enabled skills
const installedSkills = computed(() => {
  const disabled = new Set(
    Object.entries(draft.value)
      .filter(([, s]) => s === 'disabled')
      .map(([id]) => id)
  )
  const siteEnabled = Object.entries(draft.value)
    .filter(([, s]) => s === 'enabled')
    .map(([id]) => id)

  const fromGlobal = globalSkills.value.filter(s => !disabled.has(s.id))
  const fromSite = siteEnabled
    .map(id => skills.find(s => s.id === id))
    .filter((s): s is Skill => !!s && !s.installed)

  return [...fromGlobal, ...fromSite]
})

// Available = everything not installed
const availableSkills = computed(() => {
  const installedIds = new Set(installedSkills.value.map(s => s.id))
  return skills.filter(s => !installedIds.has(s.id))
})

function isGlobal(id: string): boolean {
  return skills.find(s => s.id === id)?.installed ?? false
}

function uninstall(id: string) {
  if (isGlobal(id)) {
    draft.value[id] = 'disabled'
  } else {
    delete draft.value[id]
  }
}

function install(id: string) {
  if (isGlobal(id)) {
    delete draft.value[id]
  } else {
    draft.value[id] = 'enabled'
  }
}

function installAll() {
  for (const skill of availableSkills.value) {
    install(skill.id)
  }
}

function save() {
  if (!site.value) return
  const cleaned = Object.fromEntries(
    Object.entries(draft.value).filter(([, v]) => v)
  )
  updateSite(site.value.id, {
    skillOverrides: Object.keys(cleaned).length ? cleaned : undefined,
  })
  emit('close')
}
</script>

<template>
  <Modal :open="open" :embedded="embedded" title="Site skills" width="560px" @close="emit('close')">
    <!-- Site identity -->
    <div class="site-skills__site">
      <img v-if="site?.favicon" class="site-skills__favicon" :src="site.favicon" :alt="site.name" />
      <Text variant="body" weight="semibold">{{ site?.name }}</Text>
    </div>
    <Text variant="body-small" color="muted" class="site-skills__desc">Choose which skills to install for this site.</Text>

    <!-- Installed on this site -->
    <div v-if="installedSkills.length" class="site-skills__group">
      <div class="site-skills__group-header">
        <Text variant="heading-small" color="muted">Installed on this site</Text>
      </div>
      <div class="site-skills__list">
        <div v-for="skill in installedSkills" :key="skill.id" class="site-skills__item">
          <div class="site-skills__item-info">
            <div class="site-skills__item-name">
              {{ skill.name }}
              <Badge v-if="isGlobal(skill.id)" label="Global" variant="global" />
              <Badge v-else label="Site" variant="site" />
            </div>
            <div class="site-skills__item-desc">{{ skill.description }}</div>
          </div>
          <Button variant="secondary" size="small" label="Uninstall" @click="uninstall(skill.id)" />
        </div>
      </div>
    </div>

    <!-- Available -->
    <div v-if="availableSkills.length" class="site-skills__group">
      <div class="site-skills__group-header">
        <Text variant="heading-small" color="muted">Available</Text>
        <Button variant="secondary" size="small" label="Install all" @click="installAll" />
      </div>
      <div class="site-skills__list">
        <div v-for="skill in availableSkills" :key="skill.id" class="site-skills__item">
          <div class="site-skills__item-info">
            <div class="site-skills__item-name">{{ skill.name }}</div>
            <div class="site-skills__item-desc">{{ skill.description }}</div>
          </div>
          <Button variant="secondary" size="small" label="Install" @click="install(skill.id)" />
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" label="Cancel" @click="emit('close')" />
      <Button variant="primary" label="Save" @click="save" />
    </template>
  </Modal>
</template>

<style scoped>
.site-skills__site {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  justify-content: center;
  padding-block: var(--space-s);
}

.site-skills__favicon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-s);
}

.site-skills__desc {
  text-align: center;
  display: block;
  padding-block-end: var(--space-m);
}

/* ── Groups ── */

.site-skills__group {
  margin-block-end: var(--space-m);
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: clip;
}

.site-skills__group:last-of-type {
  margin-block-end: 0;
}

.site-skills__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-m);
}

/* ── List ── */

.site-skills__list {
  background: var(--color-frame-bg);
  border-block-start: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.07);
}

.site-skills__item {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  border-block-start: 1px solid var(--color-frame-border);
}

.site-skills__item:first-child {
  border-block-start: none;
}

.site-skills__item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.site-skills__item-name {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
}

.site-skills__item-desc {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>
