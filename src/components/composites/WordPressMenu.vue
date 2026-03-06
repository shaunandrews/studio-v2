<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { dashboard, desktop, styles, symbolFilled, navigation, layout, page } from '@wordpress/icons'
import WPIcon from '@shared/primitives/WPIcon.vue'

const props = defineProps<{
  open: boolean
  anchor: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const items = [
  { icon: dashboard, label: 'WP admin' },
  { icon: desktop, label: 'Site Editor' },
  { icon: styles, label: 'Styles' },
  { icon: symbolFilled, label: 'Patterns' },
  { icon: navigation, label: 'Navigation' },
  { icon: layout, label: 'Templates' },
  { icon: page, label: 'Pages' },
]

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
    <Transition name="wp-menu">
      <div
        v-if="open"
        ref="menuRef"
        class="wp-menu"
        :style="menuStyle"
      >
        <div class="wp-menu__group">
          <div
            v-for="item in items"
            :key="item.label"
            class="wp-menu__item"
            @click="emit('close')"
          >
            <WPIcon :icon="item.icon" :size="20" class="wp-menu__icon" />
            <span class="wp-menu__label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* ── WordPress Menu (teleported, unscoped) ── */

.wp-menu {
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

.wp-menu__group {
  padding: 4px;
}

.wp-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding-inline-start: 8px;
  padding-inline-end: 12px;
  border-radius: var(--radius-s);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.wp-menu__item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.wp-menu__icon {
  flex-shrink: 0;
  color: var(--menu-fg);
  opacity: 0.7;
}

.wp-menu__item:hover .wp-menu__icon {
  opacity: 1;
}

.wp-menu__label {
  font-size: var(--font-size-s);
  line-height: 20px;
  white-space: nowrap;
}

/* ── Transition ── */

.wp-menu-enter-active,
.wp-menu-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.wp-menu-enter-from,
.wp-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
