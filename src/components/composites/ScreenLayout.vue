<script setup lang="ts">
import ScreenHeader from './ScreenHeader.vue'

defineProps<{
  title: string
  subtitle?: string
  scrollable?: boolean
}>()
</script>

<template>
  <div class="screen-layout">
    <div class="screen-layout__header">
      <ScreenHeader :title="title" :subtitle="subtitle">
        <template v-if="$slots.actions" #actions>
          <slot name="actions" />
        </template>
      </ScreenHeader>
    </div>
    <div class="screen-layout__body" :class="{ 'is-scrollable': scrollable }">
      <div class="screen-layout__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.screen-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.screen-layout__header {
  flex-shrink: 0;
  padding: var(--space-m) var(--space-l);
}

.screen-layout__body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.screen-layout__body.is-scrollable {
  justify-content: flex-start;
}

.screen-layout__content {
  width: 100%;
  max-width: 680px;
  padding: 0 var(--space-l) var(--space-l);
}
</style>
