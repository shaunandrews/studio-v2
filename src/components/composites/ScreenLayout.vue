<script setup lang="ts">
defineProps<{
  scrollable?: boolean
}>()
</script>

<template>
  <div class="screen-layout">
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

.screen-layout__body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.screen-layout__content {
  width: 100%;
  max-width: 680px;
  padding: var(--space-m) var(--space-l) var(--space-l);
  margin-block: auto;
}

.screen-layout__body.is-scrollable .screen-layout__content {
  margin-block: 0;
}
</style>
