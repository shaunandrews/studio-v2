<script setup lang="ts">
import { ref, computed } from 'vue'
import { plus, arrowUp, chevronDown, close } from '@wordpress/icons'
import { page as pageIcon, layout as templateIcon } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup, FlyoutMenuItem } from '@/components/primitives/FlyoutMenu.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import ContextRing from '@/components/primitives/ContextRing.vue'
import { codingAgents } from '@/data/agents'
import type { AgentId, Agent, TaskContextItem } from '@/data/types'

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selectedAgentId = ref<AgentId>('wpcom')
const selectedModelId = ref<string>(getStoredModel('wpcom'))

/** Get the stored model for an agent, falling back to its first model */
function getStoredModel(agentId: AgentId): string {
  const agent = codingAgents.find(a => a.id === agentId)
  const fallback = agent?.models?.[0]?.id ?? ''
  return localStorage.getItem(`model-for-${agentId}`) || fallback
}

/** Persist the selected model for the current agent */
function saveModel(agentId: AgentId, modelId: string) {
  localStorage.setItem(`model-for-${agentId}`, modelId)
}

/** Select an agent, restoring its last-used model */
function selectAgent(agentId: AgentId) {
  selectedAgentId.value = agentId
  selectedModelId.value = getStoredModel(agentId)
}

/** Select a specific model (and its agent) */
function selectModel(agentId: AgentId, modelId: string) {
  selectedAgentId.value = agentId
  selectedModelId.value = modelId
  saveModel(agentId, modelId)
}

const selectedAgentLabel = computed(() =>
  codingAgents.find(a => a.id === selectedAgentId.value)?.label ?? 'WordPress.com'
)

const selectedModelLabel = computed(() => {
  const agent = codingAgents.find(a => a.id === selectedAgentId.value)
  return agent?.models?.find(m => m.id === selectedModelId.value)?.label ?? ''
})

const installedAgents = computed(() => codingAgents.filter(a => a.installed))

function buildModelChildren(agent: Agent): FlyoutMenuItem[] | undefined {
  if (!agent.models?.length) return undefined
  return agent.models.map(model => ({
    label: model.label,
    checked: agent.id === selectedAgentId.value && model.id === selectedModelId.value,
    action: () => selectModel(agent.id, model.id),
  }))
}

const agentMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: installedAgents.value.map(agent => ({
      label: agent.label,
      iconUrl: agent.icon,
      checked: agent.id === selectedAgentId.value,
      children: buildModelChildren(agent),
      action: () => selectAgent(agent.id),
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
  elevated?: boolean
  streaming?: boolean
  pages?: { slug: string; title: string }[]
  templates?: { slug: string; label: string }[]
  currentPageSlug?: string
}>(), {
  surface: 'light',
  modelValue: '',
  placeholder: 'Ask anything...',
})

const emit = defineEmits<{
  send: [message: string, context?: TaskContextItem[]]
  stop: []
  'update:modelValue': [value: string]
  'manage-agents': []
}>()

const message = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const canSend = computed(() => message.value.trim().length > 0)

// ── Attached context ──

const attachedContext = ref<TaskContextItem[]>([])

function isPageAttached(slug: string): boolean {
  return attachedContext.value.some(c => c.type === 'page' && c.pageSlug === slug)
}

function isTemplateAttached(slug: string): boolean {
  return attachedContext.value.some(c => c.type === 'template' && c.templateSlug === slug)
}

function attachPage(slug: string, title: string) {
  if (isPageAttached(slug)) return
  attachedContext.value.push({ type: 'page', pageSlug: slug, pageTitle: title })
}

function attachTemplate(slug: string, label: string) {
  if (isTemplateAttached(slug)) return
  attachedContext.value.push({ type: 'template', templateSlug: slug, templateLabel: label })
}

function removeContext(index: number) {
  attachedContext.value.splice(index, 1)
}

// File upload
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileUpload() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  // Prototype: just log the file name. Real implementation would upload and attach.
  for (const file of input.files) {
    console.log('[InputChat] File selected:', file.name, file.type, file.size)
  }
  input.value = ''
}

const currentPageTitle = computed(() => {
  if (!props.currentPageSlug || !props.pages) return null
  const p = props.pages.find(pg => pg.slug === props.currentPageSlug)
  return p?.title ?? null
})

const attachMenuGroups = computed<FlyoutMenuGroup[]>(() => {
  const items: FlyoutMenuItem[] = []

  // Current page shortcut
  if (props.currentPageSlug && currentPageTitle.value) {
    const slug = props.currentPageSlug
    const title = currentPageTitle.value
    items.push({
      label: `Current page: ${title}`,
      detail: slug,
      icon: pageIcon,
      checked: isPageAttached(slug),
      action: () => attachPage(slug, title),
    })
  }

  // All pages
  if (props.pages?.length) {
    items.push({
      label: 'Add page...',
      icon: pageIcon,
      children: props.pages.map(p => ({
        label: p.title,
        detail: p.slug,
        checked: isPageAttached(p.slug),
        action: () => attachPage(p.slug, p.title),
      })),
    })
  }

  // Templates
  if (props.templates?.length) {
    items.push({
      label: 'Add template...',
      icon: templateIcon,
      children: props.templates.map(t => ({
        label: t.label,
        detail: t.slug,
        checked: isTemplateAttached(t.slug),
        action: () => attachTemplate(t.slug, t.label),
      })),
    })
  }

  // Upload file
  items.push({
    label: 'Upload file...',
    icon: plus,
    action: () => triggerFileUpload(),
  })

  return items.length ? [{ items }] : []
})

function send() {
  const text = message.value.trim()
  if (!text) return
  const ctx = attachedContext.value.length ? [...attachedContext.value] : undefined
  emit('send', text, ctx)
  message.value = ''
  attachedContext.value = []
}

function onKeydown(e: KeyboardEvent) {
  // Enter sends
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
    send()
    return
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

</script>

<template>
  <div class="input-chat" :class="[`surface-${props.surface}`, { 'has-content': canSend, 'is-elevated': props.elevated }]" @click="focusInput">
    <input ref="fileInputRef" type="file" class="sr-only" multiple @change="onFileSelected" />

    <div class="input-body">
      <!-- Attached context chips -->
      <div v-if="attachedContext.length" class="attached-chips">
        <span v-for="(item, i) in attachedContext" :key="i" class="attached-chip">
          <WPIcon :icon="item.type === 'template' ? templateIcon : pageIcon" :size="14" />
          <span class="attached-chip__label">
            <template v-if="item.type === 'page'">{{ item.pageTitle }}</template>
            <template v-else-if="item.type === 'template'">{{ item.templateLabel }}</template>
          </span>
          <button class="attached-chip__remove" aria-label="Remove" @click.stop="removeContext(i)">
            <WPIcon :icon="close" :size="12" />
          </button>
        </span>
      </div>
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
          <FlyoutMenu v-if="attachMenuGroups.length" :groups="attachMenuGroups" placement="above" align="start">
            <template #trigger="{ toggle }">
              <Tooltip text="Attach context" placement="top">
                <button class="input-icon-btn" aria-label="Attach context" @click="toggle">
                  <WPIcon :icon="plus" :size="24" />
                </button>
              </Tooltip>
            </template>
          </FlyoutMenu>
          <Tooltip v-else text="Attach" placement="top">
            <button class="input-icon-btn" aria-label="Attach" disabled>
              <WPIcon :icon="plus" :size="24" />
            </button>
          </Tooltip>
          <FlyoutMenu :groups="agentMenuGroups" surface="dark" placement="above" align="start">
            <template #trigger="{ toggle, open }">
              <Tooltip text="Switch agent" placement="top" :delay="600">
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
            :model="selectedModelLabel"
            tokens="12.4k / 200k"
            cost="$0.03"
            :messages="8"
            :surface="props.surface"
          />
          <button
            v-if="props.streaming"
            class="input-submit is-stop"
            aria-label="Stop"
            @click="emit('stop')"
          >
            <span class="stop-icon" />
          </button>
          <button
            v-else
            class="input-submit"
            :class="{ 'is-active': canSend }"
            :disabled="!canSend"
            aria-label="Send"
            @click="send"
          >
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

.input-chat.is-elevated:focus-within {
  box-shadow: 0 0 0 1px var(--color-frame-theme), var(--shadow-m);
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

.input-submit.is-stop {
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
  cursor: pointer;
}

.input-submit.is-stop:hover {
  opacity: 0.85;
}

.stop-icon {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: currentColor;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* ── Attached context chips ── */

.attached-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxxs);
  padding: 0;
}

.attached-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxxs);
  padding: 2px var(--space-xxs) 2px var(--space-xxs);
  border-radius: var(--radius-s);
  background: var(--color-frame-hover);
  font-size: var(--font-size-xs);
  line-height: 1;
  color: var(--color-frame-fg-muted);
}

.attached-chip__label {
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.attached-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  padding: 0;
  transition: color var(--duration-instant) var(--ease-default);
}

.attached-chip__remove:hover {
  color: var(--color-frame-fg);
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

.input-chat.surface-dark .input-submit.is-active,
.input-chat.surface-dark .input-submit.is-stop {
  background: var(--color-chrome-fg);
  color: var(--color-chrome-bg);
}

</style>
