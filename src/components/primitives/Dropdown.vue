<script setup lang="ts">
import { computed } from 'vue'
import { chevronDown } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'

export interface DropdownOption {
  value: string
  label: string
  icon?: any
  checked?: boolean
}

export interface DropdownGroup {
  label: string
  options: (string | DropdownOption)[]
}

const props = withDefaults(defineProps<{
  modelValue: string
  groups: DropdownGroup[]
  placement?: 'above' | 'below'
  align?: 'start' | 'center' | 'end'
  triggerIcon?: any
  showChevron?: boolean
  surface?: 'light' | 'dark'
  menuSurface?: 'light' | 'dark'
  size?: 'small' | 'default'
  variant?: 'inline' | 'field'
  width?: 'hug' | 'fill'
  tooltip?: string
  maxHeight?: string
}>(), {
  showChevron: true,
  surface: 'light',
  size: 'small',
  variant: 'inline',
  width: 'hug',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function normalize(opt: string | DropdownOption): DropdownOption {
  return typeof opt === 'string' ? { value: opt, label: opt } : opt
}

function currentOption(): DropdownOption | undefined {
  for (const g of props.groups) {
    for (const o of g.options) {
      const n = normalize(o)
      if (n.value === props.modelValue) return n
    }
  }
}

const flyoutGroups = computed<FlyoutMenuGroup[]>(() =>
  props.groups.map(group => ({
    label: group.label,
    items: group.options.map(opt => {
      const n = normalize(opt)
      return {
        label: n.label,
        icon: n.icon,
        checked: n.checked ?? (n.value === props.modelValue),
        action: () => emit('update:modelValue', n.value),
      }
    }),
  }))
)
</script>

<template>
  <FlyoutMenu
    :groups="flyoutGroups"
    :surface="menuSurface ?? surface"
    :placement="placement"
    :align="align ?? 'start'"
    :max-height="maxHeight"
    :class="{ 'dropdown-fill': width === 'fill' }"
  >
    <template #trigger="{ toggle, open }">
      <div class="dropdown" :class="{
        'surface-dark': surface === 'dark',
        'dropdown--fill': width === 'fill',
      }">
        <Tooltip :text="open ? undefined : tooltip">
          <button
            class="dropdown-trigger hstack"
            :class="[
              `dropdown-trigger--${size}`,
              { 'dropdown-trigger--field': variant === 'field' },
            ]"
            @click="toggle"
          >
            <WPIcon v-if="triggerIcon" :icon="currentOption()?.icon || triggerIcon" :size="18" />
            <span v-else class="dropdown-label">{{ currentOption()?.label || modelValue }}</span>
            <WPIcon v-if="showChevron" :icon="chevronDown" :size="16" />
          </button>
        </Tooltip>
      </div>
    </template>
  </FlyoutMenu>
</template>

<style scoped>
.dropdown {
  position: relative;
}

.dropdown--fill {
  width: 100%;
}

.dropdown--fill :deep(.tooltip-trigger) {
  display: flex;
}

.dropdown--fill .dropdown-trigger {
  width: 100%;
}

.dropdown-trigger {
  background: none;
  border: none;
  font-family: inherit;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default), color var(--duration-instant) var(--ease-default);
}

.dropdown-trigger--small {
  font-size: var(--font-size-s);
  border-radius: var(--radius-s);
  gap: var(--space-xxxs);
  padding: var(--space-xxxs) var(--space-xxs);
}

.dropdown-trigger--default {
  font-size: var(--font-size-m);
  border-radius: var(--radius-m);
  gap: var(--space-xxs);
  height: 35px;
  width: 35px;
  justify-content: center;
}

.dropdown-trigger:hover {
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
}

/* Field variant — bordered input-like trigger */
.dropdown-trigger--field {
  height: 40px;
  padding: 0 var(--space-xs) 0 var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  justify-content: space-between;
}

.dropdown-trigger--field:hover {
  border-color: var(--color-frame-fg-muted);
}

/* Dark surface trigger */
.dropdown.surface-dark .dropdown-trigger {
  color: var(--color-chrome-fg-muted);
}

.dropdown.surface-dark .dropdown-trigger:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-fg);
}

.dropdown.surface-dark .dropdown-trigger--field {
  border-color: var(--color-chrome-border);
  background: var(--color-chrome-bg);
}

.dropdown.surface-dark .dropdown-trigger--field:hover {
  border-color: var(--color-chrome-fg-muted);
}
</style>

<!-- Unscoped: the fill class falls through to popover-anchor via attrs -->
<style>
.dropdown-fill { width: 100%; }
</style>
