<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/primitives/Modal.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const isMac = computed(() => navigator.platform.includes('Mac'))
const mod = computed(() => isMac.value ? '⌘' : 'Ctrl')

interface Shortcut {
  label: string
  keys: string[]
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

const groups = computed<ShortcutGroup[]>(() => [
  {
    title: 'Chat',
    shortcuts: [
      { label: 'Send message', keys: ['↵'] },
      { label: 'New line', keys: ['⇧', '↵'] },
      { label: 'Quick actions', keys: ['1', '–', '9'] },
      { label: 'Slash command', keys: ['/'] },
      { label: 'New chat', keys: [mod.value, '⇧', 'K'] },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { label: 'Toggle sidebar', keys: [mod.value, 'B'] },
      { label: 'Keyboard shortcuts', keys: [mod.value, '/'] },
    ],
  },
])
</script>

<template>
  <Modal :open="open" width="420px" title="Keyboard Shortcuts" @close="emit('close')">
    <div class="shortcuts vstack">
        <div
          v-for="group in groups"
          :key="group.title"
          class="shortcuts__group vstack"
        >
          <div class="shortcuts__group-label">{{ group.title }}</div>

          <div
            v-for="shortcut in group.shortcuts"
            :key="shortcut.label"
            class="shortcuts__row hstack"
          >
            <span class="shortcuts__label">{{ shortcut.label }}</span>
            <span class="shortcuts__keys hstack">
              <kbd v-for="(key, i) in shortcut.keys" :key="i">{{ key }}</kbd>
            </span>
          </div>
        </div>
    </div>
  </Modal>
</template>

<style scoped>
.shortcuts {
  gap: var(--space-m);
}

.shortcuts__group {
  gap: 0;
}

.shortcuts__group-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-block-end: var(--space-xxs);
  margin-block-end: var(--space-xxs);
  border-block-end: 1px solid var(--color-frame-border);
}

.shortcuts__row {
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-xxs);
}

.shortcuts__label {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

.shortcuts__keys {
  gap: var(--space-xxxs);
  align-items: center;
}

.shortcuts__keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding-inline: var(--space-xxs);
  background: var(--color-frame-hover);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  line-height: 1;
}
</style>
