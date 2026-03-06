<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { moreVertical } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import type { PreviewSite } from '@/data/types'
import { usePreviews } from '@/data/usePreviews'

const props = defineProps<{
  preview: PreviewSite
  siteId: string
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

const isExpiringSoon = computed(() => {
  if (expiration.value.isExpired) return false
  const countdown = expiration.value.countdown
  return countdown.includes('hour') || countdown === '1 day' || countdown === 'Less than an hour'
})

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

const expiresText = computed(() => {
  if (props.preview.status === 'deleted') return 'Deleted'
  if (expiration.value.isExpired) {
    const d = new Date(expiration.value.expiresAt)
    const month = d.toLocaleString('en-US', { month: 'short' })
    const day = d.getDate()
    return `Expired ${month} ${day}`
  }
  return `Expires in ${expiration.value.countdown}`
})

// --- Actions ---

function handleCopy() {
  navigator.clipboard.writeText(`https://${props.preview.url}`)
}

function handleView() {
  window.open(`https://${props.preview.url}`, '_blank')
}

const menuGroups = computed<FlyoutMenuGroup[]>(() => {
  if (isInactive.value) {
    return [{ items: [{ label: 'Clear', action: () => emit('clear') }] }]
  }
  return [{
    items: [
      { label: 'Extend deadline', action: () => emit('extend') },
      { label: 'Delete', destructive: true, action: () => emit('delete') },
    ],
  }]
})
</script>

<template>
  <!-- Deleting state -->
  <div v-if="isDeleting" class="preview-card preview-card--deleting">
    <div class="vstack gap-xxs p-xs">
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
    <!-- Main section -->
    <div class="preview-card__main">
      <!-- Header row: URL + actions -->
      <div class="hstack gap-xs min-w-0">
        <a class="preview-card__url" :href="`https://${preview.url}`" target="_blank">{{ preview.url }}</a>
        <div class="hstack gap-xxs shrink-0">
          <template v-if="!isInactive">
            <Button
              variant="secondary"
              label="Copy"
              size="small"
              @click="handleCopy"
            />
            <Button
              variant="secondary"
              label="View"
              size="small"
              @click="handleView"
            />
          </template>
          <FlyoutMenu :groups="menuGroups" align="end">
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

      <!-- Note (active only) -->
      <div v-if="!isInactive" class="preview-card__note">
        <input
          v-if="isEditingNote"
          ref="noteInputRef"
          v-model="noteInput"
          class="preview-card__note-input"
          placeholder="Add notes..."
          @blur="saveNote"
          @keydown.enter="saveNote"
          @keydown.escape="isEditingNote = false"
        />
        <span
          v-else
          class="preview-card__note-text"
          :class="{ 'is-placeholder': !preview.note }"
          @click="startEditingNote"
        >{{ preview.note || 'Add notes...' }}</span>
      </div>

      <!-- Invites (active only) -->
      <div v-if="!isInactive && (preview.invites.length > 0 || isInviting)" class="hstack flex-wrap gap-xxs">
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
      </div>
    </div>

    <!-- Footer -->
    <div class="preview-card__footer">
      <div class="preview-card__stats">
        <Tooltip text="Total page loads">
          <span>{{ preview.views.toLocaleString() }} view{{ preview.views !== 1 ? 's' : '' }}</span>
        </Tooltip>
        <span class="preview-card__dot">&middot;</span>
        <Tooltip text="Unique people who visited">
          <span>{{ preview.uniqueVisitors.toLocaleString() }} visitor{{ preview.uniqueVisitors !== 1 ? 's' : '' }}</span>
        </Tooltip>
        <template v-if="preview.lastVisitedAt">
          <span class="preview-card__dot">&middot;</span>
          <span>Last visited {{ relativeTime(preview.lastVisitedAt) }}</span>
        </template>
      </div>
      <span
        class="preview-card__expires"
        :class="{ 'is-danger': isExpiringSoon || isInactive }"
      >{{ expiresText }}</span>
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  display: flex;
  flex-direction: column;
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: hidden;
}

/* ── Main section ── */

.preview-card__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  padding-block-start: var(--space-s);
  padding-block-end: var(--space-s);
  padding-inline-start: var(--space-xl);
  padding-inline-end: var(--space-s);
  background: var(--color-frame-bg);
  border-end-start-radius: var(--radius-m);
  border-end-end-radius: var(--radius-m);
  border-block-end: 1px solid var(--color-frame-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* ── URL ── */

.preview-card__url {
  flex: 1;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-frame-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
  min-width: 0;
}

.preview-card__url:hover {
  color: var(--color-frame-theme);
}

/* ── Note ── */

.preview-card__note-text {
  font-size: var(--font-size-l);
  line-height: var(--line-height-normal);
  color: var(--color-frame-fg-muted);
  cursor: pointer;
}

.preview-card__note-text:hover {
  color: var(--color-frame-fg);
}

.preview-card__note-text.is-placeholder {
  opacity: 0.5;
}

.preview-card__note-input {
  font-family: inherit;
  font-size: var(--font-size-l);
  line-height: var(--line-height-normal);
  color: var(--color-frame-fg);
  background: none;
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
}

.preview-card__note-input::placeholder {
  color: var(--color-frame-fg-muted);
  opacity: 0.5;
}

/* ── Invites ── */

.preview-card__invite-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: 2px var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  background: var(--color-frame-hover);
  border-radius: var(--radius-full);
}

.preview-card__invite-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-frame-fg-muted);
  flex-shrink: 0;
}

.preview-card__invite-pill.is-visited .preview-card__invite-dot {
  background: var(--color-status-running);
}

.preview-card__invite-remove {
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
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
  color: var(--color-frame-fg);
  background: none;
  border: none;
  outline: none;
  padding: 2px 0;
  width: 160px;
}

.preview-card__invite-input::placeholder {
  color: var(--color-frame-fg-muted);
}

/* ── Footer ── */

.preview-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--space-xl);
  padding-block: var(--space-xs);
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

.preview-card__stats {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
}

.preview-card__dot {
  opacity: 0.4;
}

.preview-card__expires {
  opacity: 0.6;
}

.preview-card__expires.is-danger {
  opacity: 1;
  color: var(--color-frame-danger);
}

/* ── Inactive (deleted / expired) ── */

.preview-card--inactive .preview-card__main {
  background: none;
}

.preview-card--inactive .preview-card__url {
  text-decoration: line-through;
  opacity: 0.6;
  color: var(--color-frame-fg-muted);
  font-weight: var(--font-weight-semibold);
}

.preview-card--inactive .preview-card__url:hover {
  color: var(--color-frame-fg-muted);
}

/* ── Deleting ── */

.preview-card--deleting {
  border-style: dashed;
}

.preview-card__detail {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
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
  background: var(--color-frame-theme);
  border-radius: var(--radius-s);
  transition: width var(--duration-fast) var(--ease-default);
}
</style>
