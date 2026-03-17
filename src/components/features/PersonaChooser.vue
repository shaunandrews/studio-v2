<script setup lang="ts">
import { personas } from '@/data/personas'
import type { Persona } from '@/data/types'

const emit = defineEmits<{
  select: [id: string]
}>()

function isUrl(str: string): boolean {
  return str.startsWith('http') || str.startsWith('/')
}

function selectPersona(persona: Persona) {
  emit('select', persona.id)
}
</script>

<template>
  <div class="persona-chooser">
    <div class="persona-chooser__content">
      <div class="persona-chooser__header">
        <h1 class="persona-chooser__title">WordPress Studio</h1>
        <p class="persona-chooser__subtitle">Choose a scenario</p>
      </div>

      <div class="persona-chooser__slots">
        <button
          v-for="persona in personas"
          :key="persona.id"
          class="persona-slot"
          @click="selectPersona(persona)"
        >
          <div class="persona-slot__icon">
            <img
              v-if="isUrl(persona.icon)"
              :src="persona.icon"
              :alt="persona.name"
              class="persona-slot__avatar"
            />
            <span v-else class="persona-slot__emoji">{{ persona.icon }}</span>
          </div>
          <div class="persona-slot__info">
            <span class="persona-slot__name">{{ persona.name }}</span>
            <span class="persona-slot__description">{{ persona.description }}</span>
          </div>
          <div class="persona-slot__meta">
            <span class="persona-slot__sites">
              {{ persona.sites.length }} {{ persona.sites.length === 1 ? 'site' : 'sites' }}
            </span>
            <span class="persona-slot__auth">
              {{ persona.auth ? 'Authenticated' : 'Not signed in' }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.persona-chooser {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.persona-chooser__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxl);
  max-width: 560px;
  width: 100%;
  padding: var(--space-xl);
}

.persona-chooser__header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.persona-chooser__title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  margin: 0;
}

.persona-chooser__subtitle {
  font-size: var(--font-size-m);
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.persona-chooser__slots {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
}

.persona-slot {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) var(--space-l);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-m);
  cursor: pointer;
  text-align: start;
  color: #fff;
  transition:
    background 150ms ease,
    border-color 150ms ease;
}

.persona-slot:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.persona-slot__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.persona-slot__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.persona-slot__emoji {
  font-size: 24px;
  line-height: 1;
}

.persona-slot__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.persona-slot__name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
}

.persona-slot__description {
  font-size: var(--font-size-s);
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-slot__meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 2px;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.4);
}
</style>
