<script setup lang="ts">
import { ref, computed } from 'vue'
import { arrowUp } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = withDefaults(defineProps<{
  surface?: 'light' | 'dark'
  placeholder?: string
  elevated?: boolean
  modelValue?: string
}>(), {
  surface: 'light',
  placeholder: 'Ask anything...',
  modelValue: '',
})

const emit = defineEmits<{
  send: [message: string]
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const message = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const canSend = computed(() => message.value.trim().length > 0)

function send() {
  const text = message.value.trim()
  if (!text) return
  emit('send', text)
  message.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
    send()
  }
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div
    class="input-chat-mini"
    :class="[`surface-${props.surface}`, { 'is-elevated': props.elevated }]"
    @click="textareaRef?.focus()"
  >
    <textarea
      ref="textareaRef"
      v-model="message"
      class="input-chat-mini__textarea"
      :placeholder="props.placeholder"
      rows="1"
      @keydown="onKeydown"
    />
    <button
      class="input-chat-mini__submit"
      :class="{ 'is-active': canSend }"
      :disabled="!canSend"
      aria-label="Send"
      @click="send"
    >
      <WPIcon :icon="arrowUp" :size="20" />
    </button>
  </div>
</template>

<style scoped>
.input-chat-mini {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-xxs) var(--space-xxs) var(--space-xxs) var(--space-s);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  cursor: text;
  transition: border-color var(--duration-instant) var(--ease-default),
    box-shadow var(--duration-instant) var(--ease-default);
}

.input-chat-mini.is-elevated {
  box-shadow: var(--shadow-m);
}

.input-chat-mini:focus-within {
  border-color: var(--color-frame-theme);
  box-shadow: 0 0 0 1px var(--color-frame-theme);
}

.input-chat-mini.is-elevated:focus-within {
  box-shadow: 0 0 0 1px var(--color-frame-theme), var(--shadow-m);
}

/* ── Textarea ── */

.input-chat-mini__textarea {
  flex: 1;
  display: block;
  width: 100%;
  background: none;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  resize: none;
  line-height: 1.5;
  field-sizing: content;
  min-height: 0;
  max-height: 100px;
  padding: var(--space-xxxs) 0;
}

.input-chat-mini__textarea::placeholder {
  color: var(--color-frame-fg-muted);
}

/* ── Submit ── */

.input-chat-mini__submit {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: var(--color-frame-border);
  color: var(--color-frame-fg-muted);
  cursor: default;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.input-chat-mini__submit.is-active {
  background: var(--color-frame-theme);
  color: #fff;
  cursor: pointer;
}

.input-chat-mini__submit.is-active:hover {
  opacity: 0.85;
}

/* ── Dark surface ── */

.input-chat-mini.surface-dark {
  background: var(--color-chrome-bg);
  border-color: var(--color-chrome-border);
}

.input-chat-mini.surface-dark:focus-within {
  border-color: var(--color-chrome-theme);
}

.input-chat-mini.surface-dark .input-chat-mini__textarea {
  color: var(--color-chrome-fg);
}

.input-chat-mini.surface-dark .input-chat-mini__textarea::placeholder {
  color: var(--color-chrome-fg-muted);
}

.input-chat-mini.surface-dark .input-chat-mini__submit {
  background: var(--color-chrome-border);
  color: var(--color-chrome-fg-muted);
}

.input-chat-mini.surface-dark .input-chat-mini__submit.is-active,
.input-chat-mini.surface-dark .input-chat-mini__submit.is-stop {
  background: var(--color-chrome-fg);
  color: var(--color-chrome-bg);
}
</style>
