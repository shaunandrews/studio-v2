<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from '@/components/primitives/Button.vue'
import Popover from '@/components/primitives/Popover.vue'
import ShortcutsModal from '@/components/composites/ShortcutsModal.vue'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { useSettings } from '@/data/useSettings'
import { useAuth } from '@/data/useAuth'
import { usePersona } from '@/data/usePersona'

const { mod } = useOperatingSystem()
const { openSettings } = useSettings()
const { user } = useAuth()
const { clearPersona } = usePersona()

const props = defineProps<{
  open: boolean
  anchor: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

const showShortcuts = ref(false)

function close() {
  emit('close')
}

function openPreferences() {
  close()
  openSettings()
}

function openShortcuts() {
  close()
  showShortcuts.value = true
}

function switchPersona() {
  close()
  clearPersona()
}
</script>

<template>
  <Popover
    surface="dark"
    placement="above"
    align="start"
    bare
    :anchor="anchor"
    :model-value="open"
    @close="close"
  >
    <div class="global-menu">
      <!-- Account row -->
      <div class="global-menu__section global-menu__account">
        <img
          v-if="user"
          class="global-menu__avatar"
          :src="user.avatar"
          alt="User"
        />
        <span class="global-menu__email">{{ user?.email ?? 'Not signed in' }}</span>
        <Button size="small" variant="secondary" surface="dark" label="Logout" />
      </div>

      <!-- Usage meters -->
      <div class="global-menu__section global-menu__usage">
        <span class="global-menu__usage-label">Usage</span>
        <div class="global-menu__meter">
          <div class="global-menu__meter-header">
            <span class="global-menu__meter-label">Preview sites</span>
            <span class="global-menu__meter-count">1 of 10</span>
          </div>
          <div class="global-menu__meter-track">
            <div class="global-menu__meter-fill" style="width: 10%"></div>
          </div>
        </div>
        <div class="global-menu__meter">
          <div class="global-menu__meter-header">
            <span class="global-menu__meter-label">AI chat</span>
            <span class="global-menu__meter-count">0 of 1,000</span>
          </div>
          <div class="global-menu__meter-track">
            <div class="global-menu__meter-fill" style="width: 0%"></div>
          </div>
        </div>
      </div>

      <!-- Links -->
      <div class="global-menu__section global-menu__nav">
        <div class="global-menu__item" @click="switchPersona">
          Switch persona
        </div>
        <RouterLink to="/overviews" class="global-menu__item" @click="close">
          Design Overviews
        </RouterLink>
        <RouterLink to="/dev/design-system" class="global-menu__item" @click="close">
          Design System
        </RouterLink>
        <RouterLink to="/dev/components" class="global-menu__item" @click="close">
          Components
        </RouterLink>
        <RouterLink to="/dev/architecture" class="global-menu__item" @click="close">
          Architecture
        </RouterLink>
        <div class="global-menu__item" @click="openShortcuts">
          <span class="global-menu__item-label">Keyboard shortcuts</span>
          <span class="global-menu__item-shortcut">{{ mod }}/</span>
        </div>
        <div class="global-menu__item" @click="openPreferences">
          <span class="global-menu__item-label">Settings</span>
          <span class="global-menu__item-shortcut">{{ mod }},</span>
        </div>
      </div>
    </div>
  </Popover>
  <ShortcutsModal :open="showShortcuts" @close="showShortcuts = false" />
</template>

<style>
/* ── Global Menu (teleported via Popover, unscoped) ── */

.global-menu {
  --menu-bg: #111;
  --menu-border: rgba(255, 255, 255, 0.15);
  --menu-fg: white;

  width: 270px;
  background: var(--menu-bg);
  border: 1px solid var(--menu-border);
  border-radius: var(--radius-m);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  color: var(--menu-fg);
  overflow: hidden;
}

/* ── Sections ── */

.global-menu__section {
  padding: 12px;
}

.global-menu__section + .global-menu__section {
  border-block-start: 1px solid var(--menu-border);
}

/* ── Account row ── */

.global-menu__account {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.global-menu__avatar {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.global-menu__email {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-s);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Usage section ── */

.global-menu__usage {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-block-end: 16px;
}

.global-menu__usage-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.global-menu__meter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-xs);
}

.global-menu__meter-label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
}

.global-menu__meter-count {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.5);
}

.global-menu__meter-track {
  height: 2px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.global-menu__meter-fill {
  height: 100%;
  background: var(--color-frame-theme);
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--ease-default);
}

/* ── Nav section ── */

.global-menu__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-xxs) 0;
}

.global-menu__nav .global-menu__item {
  padding-inline: 12px;
  text-decoration: none;
  color: var(--menu-fg);
}

/* ── Menu item ── */

.global-menu__item {
  height: 32px;
  display: flex;
  align-items: center;
  font-size: var(--font-size-s);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.global-menu__item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.global-menu__item-label {
  flex: 1;
}

.global-menu__item-shortcut {
  flex-shrink: 0;
  margin-inline-start: var(--space-m);
  font-size: var(--font-size-xs);
  opacity: 0.4;
}
</style>
