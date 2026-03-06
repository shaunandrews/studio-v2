<script setup lang="ts">
import { ref, computed } from 'vue'
import { search as searchIcon } from '@wordpress/icons'
import Modal from '../primitives/Modal.vue'
import Text from '../primitives/Text.vue'
import WPIcon from '../primitives/WPIcon.vue'
import { useConversations } from '@/data/useConversations'

const props = defineProps<{
  projectId: string
  open: boolean
  activeConvoId: string
}>()

const emit = defineEmits<{
  close: []
  select: [conversationId: string]
}>()

const { conversations, messages } = useConversations()

const query = ref('')

const projectChats = computed(() => {
  return conversations.value
    .filter(c => c.projectId === props.projectId)
    .map(c => ({
      id: c.id,
      title: c.title || 'New chat',
      archived: !!c.archived,
      messageCount: messages.value.filter(m => m.conversationId === c.id).length,
      createdAt: c.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

const filteredChats = computed(() => {
  if (!query.value.trim()) return projectChats.value
  const q = query.value.toLowerCase()
  return projectChats.value.filter(c => c.title.toLowerCase().includes(q))
})
</script>

<template>
  <Modal :open="open" width="420px" @close="emit('close')">
    <div class="all-chats vstack">
      <div class="all-chats__header hstack px-m pt-m pb-xs">
        <Text variant="title" class="flex-1">All chats</Text>
      </div>

      <div class="all-chats__search hstack gap-xs px-m pb-xs">
        <div class="all-chats__search-field hstack gap-xs flex-1">
          <WPIcon :icon="searchIcon" :size="18" class="all-chats__search-icon" />
          <input
            v-model="query"
            type="text"
            class="all-chats__search-input"
            placeholder="Search chats..."
          />
        </div>
      </div>

      <div class="all-chats__list vstack">
        <button
          v-for="chat in filteredChats"
          :key="chat.id"
          class="all-chats__item hstack gap-xs px-m"
          :class="{
            'all-chats__item--active': chat.id === activeConvoId,
            'all-chats__item--archived': chat.archived,
          }"
          @click="emit('select', chat.id)"
        >
          <Text class="flex-1 all-chats__item-title" :color="chat.archived ? 'muted' : 'default'">{{ chat.title }}</Text>
          <Text variant="caption" color="muted" class="all-chats__item-count">{{ chat.messageCount }}</Text>
        </button>

        <div v-if="filteredChats.length === 0" class="all-chats__empty px-m py-m">
          <Text color="muted">No chats found</Text>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.all-chats {
  max-height: 80vh;
}

.all-chats__search-field {
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-s);
  padding: var(--space-xxs) var(--space-xs);
  align-items: center;
}

.all-chats__search-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.all-chats__search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-text);
}

.all-chats__search-input::placeholder {
  color: var(--color-text-muted);
}

.all-chats__list {
  overflow-y: auto;
  max-height: 400px;
  padding-block-end: var(--space-xs);
}

.all-chats__item {
  width: 100%;
  padding-block: var(--space-xs);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: start;
  align-items: center;
  transition: background var(--duration-instant) var(--ease-default);
}

.all-chats__item:hover {
  background: var(--color-surface-secondary);
}

.all-chats__item--active {
  background: var(--color-surface-secondary);
}

.all-chats__item--archived .all-chats__item-title {
  font-style: italic;
}

.all-chats__item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.all-chats__item-count {
  flex-shrink: 0;
}

.all-chats__empty {
  text-align: center;
}
</style>
