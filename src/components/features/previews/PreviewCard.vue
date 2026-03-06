<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { moreVertical, copy } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import type { PreviewSite } from '@/data/types'
import { usePreviews } from '@/data/usePreviews'

const props = defineProps<{
  preview: PreviewSite
  projectId: string
}>()

const emit = defineEmits<{
  delete: []
  extend: []
  clear: []
}>()

const { getExpiration, relativeTime, operationForPreview, updateNote, addInvite, removeInvite } = usePreviews()

const operation = computed(() => operationForPreview(props.preview.id).value)

// --- "Just updated" flash ---

const justUpdated = ref(false)
let justUpdatedTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => operation.value?.status,
  (newStatus, oldStatus) => {
    if (
      oldStatus === 'pending' &&
      newStatus === 'fulfilled' &&
      operation.value?.type === 'update'
    ) {
      justUpdated.value = true
      if (justUpdatedTimer) clearTimeout(justUpdatedTimer)
      justUpdatedTimer = setTimeout(() => {
        justUpdated.value = false
      }, 60_000)
    }
  },
)

// --- Derived state ---

const expiration = computed(() => getExpiration(props.preview.updatedAt))

const isInactive = computed(
  () => props.preview.status === 'deleted' || expiration.value.isExpired,
)

const isDeleting = computed(
  () => operation.value?.type === 'delete' && operation.value.status === 'pending',
)

// --- Note editing ---

const isEditingNote = ref(false)
const noteInput = ref(props.preview.note ?? '')
const noteInputRef = ref<HTMLInputElement | null>(null)

function startEditingNote() {
  noteInput.value = props.preview.note ?? ''
  isEditingNote.value = true
  nextTick(() => noteInputRef.value?.focus())
}

function saveNote() {
  updateNote(props.preview.id, noteInput.value.trim())
  isEditingNote.value = false
}

// --- Invites ---

const isInviting = ref(false)
const inviteInput = ref('')
const inviteInputRef = ref<HTMLInputElement | null>(null)

function startInviting() {
  inviteInput.value = ''
  isInviting.value = true
  nextTick(() => inviteInputRef.value?.focus())
}

function submitInvite() {
  const email = inviteInput.value.trim()
  if (email && email.includes('@')) {
    addInvite(props.preview.id, email)
    inviteInput.value = ''
  }
  isInviting.value = false
}

// --- Status line ---

const statusText = computed(() => {
  if (isDeleting.value) return operation.value!.detail
  if (props.preview.status === 'deleted') return 'Deleted'
  if (expiration.value.isExpired) return 'Expired'
  if (justUpdated.value) return 'Just updated'
  return `Updated ${relativeTime(props.preview.updatedAt)}`
})

const expiresText = computed(() => {
  if (props.preview.status === 'deleted') return ''
  if (expiration.value.isExpired) return ''
  return `Expires in ${expiration.value.countdown}`
})

const statsText = computed(() => {
  const parts: string[] = []
  parts.push(`${props.preview.views} view${props.preview.views !== 1 ? 's' : ''}`)
  parts.push(`${props.preview.uniqueVisitors} visitor${props.preview.uniqueVisitors !== 1 ? 's' : ''}`)
  if (props.preview.lastVisitedAt) {
    parts.push(`Last visited ${relativeTime(props.preview.lastVisitedAt)}`)
  }
  return parts.join(' · ')
})

// --- Actions ---

function handleCopy() {
  navigator.clipboard.writeText(`https://${props.preview.url}`)
}

const menuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      { label: 'Extend deadline', action: () => emit('extend') },
      { label: 'Delete', destructive: true, action: () => emit('delete') },
    ],
  },
])
</script>

<template>
  <!-- Deleting state -->
  <div v-if="isDeleting" class="preview-card preview-card--deleting">
    <div class="preview-card__body">
      <span class="preview-card__detail">{{ operation!.detail }}</span>
      <div class="preview-card__track">
        <div
          class="preview-card__fill"
          :style="{ width: `${operation!.progress}%` }"
        />
      </div>
    </div>
  </div>

  <!-- Normal / Inactive -->
  <div v-else class="preview-card" :class="{ 'preview-card--inactive': isInactive }">
    <div class="preview-card__body">
      <!-- URL -->
      <div class="preview-card__url-row">
        <a class="preview-card__url" :href="`https://${preview.url}`" target="_blank">{{ preview.url }}</a>
        <Button
          v-if="!isInactive"
          variant="tertiary"
          :icon="copy"
          icon-only
          size="small"
          tooltip="Copy link"
          @click="handleCopy"
        />
      </div>

      <!-- Note -->
      <div v-if="!isInactive" class="preview-card__note">
        <input
          v-if="isEditingNote"
          ref="noteInputRef"
          v-model="noteInput"
          class="preview-card__note-input"
          placeholder="Add a note..."
          @blur="saveNote"
          @keydown.enter="saveNote"
          @keydown.escape="isEditingNote = false"
        />
        <span
          v-else
          class="preview-card__note-text"
          :class="{ 'is-placeholder': !preview.note }"
          @click="startEditingNote"
        >{{ preview.note || 'Add a note...' }}</span>
      </div>

      <!-- Stats -->
      <div v-if="!isInactive && preview.views > 0" class="preview-card__stats">
        {{ statsText }}
      </div>

      <!-- Invites -->
      <div v-if="!isInactive" class="preview-card__invites">
        <span
          v-for="invite in preview.invites"
          :key="invite.email"
          class="preview-card__invite-pill"
          :class="{ 'is-visited': invite.visitedAt }"
        >
          <span class="preview-card__invite-dot" />
          {{ invite.email }}
          <button class="preview-card__invite-remove" @click="removeInvite(preview.id, invite.email)">&times;</button>
        </span>
        <input
          v-if="isInviting"
          ref="inviteInputRef"
          v-model="inviteInput"
          class="preview-card__invite-input"
          placeholder="email@example.com"
          type="email"
          @blur="submitInvite"
          @keydown.enter="submitInvite"
          @keydown.escape="isInviting = false"
        />
        <button
          v-else
          class="preview-card__invite-btn"
          @click="startInviting"
        >Invite</button>
      </div>

      <!-- Meta -->
      <div class="preview-card__meta">
        <span class="preview-card__status">{{ statusText }}</span>
        <span v-if="expiresText" class="preview-card__expires">{{ expiresText }}</span>
      </div>
    </div>

    <div class="preview-card__actions">
      <Button
        v-if="isInactive"
        variant="tertiary"
        label="Clear"
        size="small"
        @click="emit('clear')"
      />
      <FlyoutMenu v-else :groups="menuGroups" align="end">
        <template #trigger="{ toggle }">
          <Button
            variant="tertiary"
            :icon="moreVertical"
            icon-only
            size="small"
            @click="toggle"
          />
        </template>
      </FlyoutMenu>
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-m);
  padding: var(--space-m);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: hidden;
}

.preview-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.preview-card__url-row {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.preview-card__url {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
  min-width: 0;
}

.preview-card__url:hover {
  color: var(--color-primary);
}

.preview-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
}

.preview-card__expires {
  opacity: 0.7;
}

.preview-card__expires::before {
  content: '·';
  margin-inline-end: var(--space-xs);
}

/* ── Note ── */

.preview-card__note {
  min-height: 24px;
  display: flex;
  align-items: center;
}

.preview-card__note-text {
  font-size: var(--font-size-s);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.preview-card__note-text:hover {
  color: var(--color-text);
}

.preview-card__note-text.is-placeholder {
  color: var(--color-text-muted);
  font-style: italic;
}

.preview-card__note-input {
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-text);
  background: none;
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
}

.preview-card__note-input::placeholder {
  color: var(--color-text-muted);
  font-style: italic;
}

/* ── Stats ── */

.preview-card__stats {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Invites ── */

.preview-card__invites {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-xxs);
}

.preview-card__invite-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: 2px var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface-secondary);
  border-radius: var(--radius-full);
}

.preview-card__invite-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted);
  flex-shrink: 0;
}

.preview-card__invite-pill.is-visited .preview-card__invite-dot {
  background: var(--color-success, #16a34a);
}

.preview-card__invite-remove {
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0;
  transition: opacity var(--duration-instant) var(--ease-default);
}

.preview-card__invite-pill:hover .preview-card__invite-remove {
  opacity: 1;
}

.preview-card__invite-input {
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-text);
  background: none;
  border: none;
  outline: none;
  padding: 2px 0;
  width: 160px;
}

.preview-card__invite-input::placeholder {
  color: var(--color-text-muted);
}

.preview-card__invite-btn {
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px var(--space-xxs);
}

.preview-card__invite-btn:hover {
  text-decoration: underline;
}

.preview-card__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ── Inactive (deleted / expired) ── */

.preview-card--inactive {
  opacity: 0.6;
}

.preview-card--inactive .preview-card__url {
  text-decoration: line-through;
  color: var(--color-frame-fg-muted);
}

/* ── Deleting ── */

.preview-card--deleting {
  border-style: dashed;
}

.preview-card--deleting .preview-card__body {
  gap: var(--space-xxs);
}

.preview-card__detail {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
}

.preview-card__track {
  width: 100%;
  max-width: 200px;
  height: 4px;
  background: var(--color-frame-border);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.preview-card__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-s);
  transition: width 150ms ease;
}
</style>
