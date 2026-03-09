<script setup lang="ts">
import { ref, computed } from 'vue'
import { plus, arrowUp, chevronDown } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import ContextRing from '@/components/primitives/ContextRing.vue'
import { codingAgents } from '@/data/agents'
import type { ActionButton, AgentId } from '@/data/types'

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selectedAgentId = ref<AgentId>('wpcom')

const selectedAgentLabel = computed(() =>
  codingAgents.find(a => a.id === selectedAgentId.value)?.label ?? 'WordPress.com'
)

const installedAgents = computed(() => codingAgents.filter(a => a.installed))

const agentMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: installedAgents.value.map(agent => ({
      label: agent.label,
      iconUrl: agent.icon,
      checked: agent.id === selectedAgentId.value,
      action: () => { selectedAgentId.value = agent.id },
    })),
  },
  {
    items: [{ label: 'Manage agents...', action: () => emit('manage-agents') }],
  },
])

const props = withDefaults(defineProps<{
  surface?: 'light' | 'dark'
  siteId?: string | null
  modelValue?: string
  placeholder?: string
  actions?: ActionButton[]
  elevated?: boolean
}>(), {
  surface: 'light',
  modelValue: '',
  placeholder: 'Ask anything...',
  actions: () => [],
})

const emit = defineEmits<{
  send: [message: string]
  'update:modelValue': [value: string]
  action: [action: ActionButton]
  'manage-agents': []
}>()

const message = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const hasCardActions = computed(() => props.actions.some(a => a.card))

const canSend = computed(() => message.value.trim().length > 0)

function send() {
  const text = message.value.trim()
  if (!text) return
  emit('send', text)
  message.value = ''
}

function onKeydown(e: KeyboardEvent) {
  // Enter sends
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
    send()
    return
  }

  // Number keys (1-9, 0) trigger actions when the input is empty
  if (props.actions.length && !message.value.trim() && e.key >= '0' && e.key <= '9') {
    const idx = e.key === '0' ? 9 : Number(e.key) - 1
    const action = props.actions[idx]
    if (action) {
      e.preventDefault()
      emit('action', action)
    }
  }
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })

function focusInput(e: MouseEvent) {
  // Don't steal focus from buttons inside the component
  const target = e.target as HTMLElement
  if (target.closest('button')) return
  textareaRef.value?.focus()
}

function buttonVariant(variant?: ActionButton['variant']): 'primary' | 'secondary' | 'tertiary' {
  if (variant === 'primary') return 'primary'
  if (variant === 'destructive') return 'tertiary'
  return 'secondary'
}

function actionLabel(idx: number): string {
  return `${idx < 9 ? idx + 1 : 0}`
}
</script>

<template>
  <div class="input-chat" :class="[`surface-${props.surface}`, { 'has-content': canSend, 'is-elevated': props.elevated }]" @click="focusInput">

    <!-- Card actions: caller controls all styling and content -->
    <div v-if="hasCardActions" class="input-actions-cards hstack gap-xs">
      <button
        v-for="(action, idx) in actions"
        :key="action.id"
        class="action-card action-enter"
        :style="{ ...action.card?.style, animationDelay: `${idx * 60}ms` }"
        :aria-label="action.label"
        @click="$emit('action', action)"
      >
        <span class="action-card__badge">{{ actionLabel(idx) }}</span>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-if="action.card" v-html="action.card.content" />
      </button>
    </div>

    <!-- Regular text actions -->
    <div v-else-if="actions.length" class="input-actions hstack gap-xxs flex-wrap">
      <span
        v-for="(action, idx) in actions"
        :key="action.id"
        class="action-enter"
        :style="{ animationDelay: `${idx * 30}ms` }"
      >
        <Button
          :label="`${actionLabel(idx)}. ${action.label}`"
          :icon="action.icon"
          :variant="buttonVariant(action.variant)"
          size="small"
          @click="$emit('action', action)"
        />
      </span>
    </div>

    <div class="input-body">
      <textarea
        ref="textareaRef"
        v-model="message"
        class="input-textarea"
        :placeholder="props.placeholder"
        rows="1"
        @keydown="onKeydown"
      />
      <div class="input-toolbar">
        <div class="input-toolbar__start">
          <Tooltip text="Attach" placement="bottom">
            <button class="input-icon-btn" aria-label="Attach">
              <WPIcon :icon="plus" :size="24" />
            </button>
          </Tooltip>
          <FlyoutMenu :groups="agentMenuGroups" surface="dark" placement="above" align="start">
            <template #trigger="{ toggle, open }">
              <Tooltip text="Switch agent" placement="bottom" :delay="600">
                <button class="agent-picker" :class="{ 'is-open': open }" @click="toggle">
                  <span class="agent-picker__label">{{ selectedAgentLabel }}</span>
                  <WPIcon :icon="chevronDown" :size="16" class="agent-picker__chevron" />
                </button>
              </Tooltip>
            </template>
          </FlyoutMenu>
        </div>
        <div class="input-toolbar__end gap-xs">
          <ContextRing
            :percent="42"
            model="Claude Sonnet 4"
            tokens="12.4k / 200k"
            cost="$0.03"
            :messages="8"
            :surface="props.surface"
          />
          <button class="input-submit" :class="{ 'is-active': canSend }" :disabled="!canSend" aria-label="Send" @click="send">
            <WPIcon :icon="arrowUp" :size="24" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-chat {
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-xl);
  cursor: text;
  transition: border-color var(--duration-instant) var(--ease-default),
    box-shadow var(--duration-slow) var(--ease-default);
}

.input-chat.is-elevated {
  box-shadow: var(--shadow-m);
}

.input-chat:focus-within {
  border-color: var(--color-frame-theme);
  box-shadow: 0 0 0 1px var(--color-frame-theme);
}

/* ── Input body: textarea + toolbar ── */

.input-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  padding: var(--space-xs) var(--space-s) var(--space-xxs);
}

.input-textarea {
  display: block;
  width: 100%;
  background: none;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: var(--font-size-l);
  color: var(--color-frame-fg);
  resize: none;
  line-height: 1.6;
  letter-spacing: -0.15px;
  field-sizing: content;
  min-height: 0;
  max-height: 150px; /* ~7 lines — intentional cap */
  padding: var(--space-xxs) var(--space-xxxs);
}

.input-textarea::placeholder {
  color: var(--color-frame-fg-muted);
}

/* ── Toolbar ── */

.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
}

.input-toolbar__start,
.input-toolbar__end {
  display: flex;
  align-items: center;
}

.input-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: color var(--duration-instant) var(--ease-default);
}

.input-icon-btn:hover {
  color: var(--color-frame-fg);
}

/* ── Agent picker ── */

.agent-picker {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 26px;
  padding: 0 var(--space-xxxs) 0 var(--space-xs);
  border: none;
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.agent-picker:hover,
.agent-picker.is-open {
  color: var(--color-frame-fg);
}

.agent-picker__chevron {
  flex-shrink: 0;
}

/* ── Submit button: 32px circle ── */

.input-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--color-frame-border);
  color: var(--color-frame-fg-muted);
  cursor: default;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.input-submit.is-active {
  background: var(--color-frame-theme);
  color: #fff;
  cursor: pointer;
}

.input-submit.is-active:hover {
  opacity: 0.85;
}

/* ── Dark surface variant ── */

.input-chat.surface-dark {
  background: var(--color-chrome-secondary);
  border-color: var(--color-chrome-border);
}

.input-chat.surface-dark:focus-within {
  border-color: var(--color-chrome-fg-muted);
}

.input-chat.surface-dark .input-textarea {
  color: var(--color-chrome-fg);
}

.input-chat.surface-dark .input-textarea::placeholder {
  color: var(--color-chrome-fg-muted);
}

.input-chat.surface-dark .input-icon-btn {
  color: var(--color-chrome-fg-muted);
}

.input-chat.surface-dark .input-icon-btn:hover {
  color: var(--color-chrome-fg);
}

.input-chat.surface-dark .input-submit {
  background: var(--color-chrome-border);
  color: var(--color-chrome-fg-muted);
}

.input-chat.surface-dark .input-submit.is-active {
  background: var(--color-chrome-fg);
  color: var(--color-chrome-bg);
}


/* ── Actions above input ── */

.input-actions-cards,
.input-actions {
  padding: var(--space-xs) var(--space-xs) 0;
}

/* Staggered action entrance */
.action-enter {
  animation: action-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes action-pop {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
  }
}

/* Card actions — InputChat provides the container, caller controls everything else */
.input-actions-cards {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  align-items: stretch;
}

.action-card {
  position: relative;
  flex: 1 1 0;
  min-width: 140px;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  padding: var(--space-xs) var(--space-s);
  text-align: start;
  cursor: pointer;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  transition: transform 0.15s ease;
}

.action-card:hover {
  transform: scale(1.02);
}

.action-card:active {
  transform: scale(0.98);
}

.action-card__badge {
  position: absolute;
  inset-block-start: var(--space-xxxs);
  inset-inline-end: var(--space-xxxs);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  opacity: 0.4;
}
</style>
