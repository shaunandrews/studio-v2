<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { check } from '@wordpress/icons'
import WPIcon from '@shared/primitives/WPIcon.vue'

const props = defineProps<{
  open: boolean
  anchor: HTMLElement | null
  selected?: string
}>()

const emit = defineEmits<{
  close: []
  select: [label: string, iconUrl: string]
}>()

const appGroups = [
  {
    items: [
      { label: 'Browser', iconUrl: '/icons/chrome.svg' },
      { label: 'VS Code', iconUrl: '/icons/vscode.svg' },
      { label: 'Cursor', iconUrl: '/icons/cursor.svg' },
      { label: 'Claude', iconUrl: '/icons/claude.svg' },
      { label: 'Codex', iconUrl: '/icons/codex-color.svg' },
    ],
  },
  {
    items: [
      { label: 'Terminal', iconUrl: '/icons/terminal.svg' },
      { label: 'Finder', iconUrl: '/icons/finder.svg' },
    ],
  },
]

const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

function position() {
  const anchor = props.anchor
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  menuStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`, /* Physical: right-aligned to anchor edge */
    zIndex: '9999',
  }
}

function onMousedown(e: MouseEvent) {
  const target = e.target as Node
  if (menuRef.value?.contains(target)) return
  if (props.anchor?.contains(target)) return
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

const allItems = appGroups.flatMap(g => g.items)

function selectItem(label: string) {
  const item = allItems.find(i => i.label === label)
  if (item) emit('select', item.label, item.iconUrl)
  emit('close')
}

watch(() => props.open, (val) => {
  if (val) position()
})

onMounted(() => {
  document.addEventListener('mousedown', onMousedown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onMousedown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="open-menu">
      <div
        v-if="open"
        ref="menuRef"
        class="open-menu"
        :style="menuStyle"
      >
        <div
          v-for="(group, gi) in appGroups"
          :key="gi"
          class="open-menu__group"
        >
          <div
            v-for="item in group.items"
            :key="item.label"
            class="open-menu__item"
            @click="selectItem(item.label)"
          >
            <span class="open-menu__icon">
              <img :src="item.iconUrl" alt="" class="open-menu__icon-img" />
            </span>
            <span class="open-menu__label">{{ item.label }}</span>
            <WPIcon
              v-if="selected === item.label"
              :icon="check"
              :size="18"
              class="open-menu__check"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* ── Open Menu (teleported, unscoped) ── */

.open-menu {
  --menu-bg: #111;
  --menu-border: rgba(255, 255, 255, 0.15);
  --menu-fg: white;

  width: 158px;
  background: var(--menu-bg);
  border: 1px solid var(--menu-border);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  color: var(--menu-fg);
  overflow: hidden;
  padding: 1px;
}

.open-menu__group {
  padding: 4px;
}

.open-menu__group + .open-menu__group {
  border-block-start: 1px solid var(--menu-border);
}

.open-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding-inline-start: 8px;
  padding-inline-end: 4px;
  border-radius: var(--radius-s);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.open-menu__item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.open-menu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.open-menu__icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
}

.open-menu__label {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-s);
  line-height: 20px;
  white-space: nowrap;
}

.open-menu__check {
  flex-shrink: 0;
  color: var(--menu-fg);
  opacity: 0.7;
}

/* ── Transition ── */

.open-menu-enter-active,
.open-menu-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.open-menu-enter-from,
.open-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
