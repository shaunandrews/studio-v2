<script setup lang="ts">
import { computed } from 'vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import Popover from '@/components/primitives/Popover.vue'

const props = withDefaults(defineProps<{
  percent: number
  model?: string
  tokens?: string
  cost?: string
  messages?: number
  surface?: 'light' | 'dark'
}>(), {
  model: '',
  tokens: '',
  cost: '',
  messages: 0,
  surface: 'light',
})

const circumference = 37.70 // 2 * PI * 6 (radius)
const dashoffset = computed(() => circumference * (1 - props.percent / 100))

const isWarning = computed(() => props.percent >= 80)
const isCritical = computed(() => props.percent >= 95)

const stats = computed(() => {
  const items: { label: string; value: string }[] = []
  if (props.model) items.push({ label: 'Model', value: props.model })
  if (props.tokens) items.push({ label: 'Tokens', value: props.tokens })
  if (props.cost) items.push({ label: 'Est. cost', value: props.cost })
  if (props.messages > 0) items.push({ label: 'Messages', value: String(props.messages) })
  return items
})
</script>

<template>
  <Popover surface="dark" placement="above" align="end">
    <template #trigger="{ toggle, open }">
      <Tooltip :text="open ? undefined : `Context: ${percent}% used`" placement="bottom">
        <button
          class="context-ring-trigger"
          :class="[`surface-${surface}`, { active: open, warning: isWarning, critical: isCritical }]"
          aria-label="Context window usage"
          @click="toggle"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle class="context-ring__track" cx="8" cy="8" r="6" />
            <circle
              class="context-ring__fill"
              :class="{ warning: isWarning, critical: isCritical }"
              cx="8" cy="8" r="6"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashoffset"
            />
          </svg>
        </button>
      </Tooltip>
    </template>
    <dl class="context-info">
      <div v-for="stat in stats" :key="stat.label" class="context-info__row">
        <dt class="context-info__label">{{ stat.label }}</dt>
        <dd class="context-info__value">{{ stat.value }}</dd>
      </div>
    </dl>
  </Popover>
</template>

<style scoped>
.context-ring-trigger {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  border-radius: var(--radius-s);
  padding: var(--space-xxxs);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.context-ring-trigger:hover {
  background: var(--color-frame-bg);
}

.context-ring-trigger.active {
  background: var(--color-frame-bg);
}

.context-ring-trigger svg {
  display: block;
  transform: rotate(-90deg); /* Start arc from 12 o'clock */
}

.context-ring__track {
  fill: none;
  stroke: var(--color-frame-border);
  stroke-width: 2.5;
}

.context-ring__fill {
  fill: none;
  stroke: var(--color-frame-fg-muted);
  stroke-width: 2.5;
  stroke-linecap: round;
  transition:
    stroke-dashoffset var(--duration-moderate) var(--ease-default),
    stroke var(--duration-moderate) var(--ease-default);
}

.context-ring__fill.warning {
  stroke: #d63638;
}

.context-ring__fill.critical {
  stroke: #d63638;
  animation: context-pulse 1.5s ease-in-out infinite;
}

@keyframes context-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Context info popover content ── */

.context-info {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.context-info__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-l);
}

.context-info__label {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
}

.context-info__value {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg);
  margin: 0;
}

/* Dark surface variants */
.context-ring-trigger.surface-dark:hover,
.context-ring-trigger.surface-dark.active {
  background: var(--color-chrome-hover);
}

.surface-dark .context-ring__track {
  stroke: var(--color-chrome-border);
}

.surface-dark .context-ring__fill {
  stroke: var(--color-chrome-fg-muted);
}

.surface-dark .context-ring__fill.warning,
.surface-dark .context-ring__fill.critical {
  stroke: #d63638;
}

/* Dark mode (system) */
@media (prefers-color-scheme: dark) {
  .context-ring-trigger:not(.surface-dark) .context-ring__fill {
    stroke: var(--color-frame-fg-muted);
  }

  .context-ring-trigger:not(.surface-dark) .context-ring__fill.warning,
  .context-ring-trigger:not(.surface-dark) .context-ring__fill.critical {
    stroke: #d63638;
  }
}
</style>
