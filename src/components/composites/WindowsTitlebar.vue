<script setup lang="ts">
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
</script>

<template>
  <div class="windows-titlebar">
    <div class="titlebar-start">
      <WPIcon :icon="wordpress" :size="20" class="titlebar-wp-icon" />
      <span class="titlebar-app-name">Studio</span>
      <nav class="titlebar-menu">
        <span class="titlebar-menu-item">File</span>
        <span class="titlebar-menu-item">Edit</span>
        <span class="titlebar-menu-item">View</span>
        <span class="titlebar-menu-item">Help</span>
      </nav>
    </div>
    <div class="titlebar-end">
      <button class="titlebar-btn titlebar-btn--minimize">
        <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
      </button>
      <button class="titlebar-btn titlebar-btn--maximize">
        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1" /></svg>
      </button>
      <button class="titlebar-btn titlebar-btn--close">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.windows-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  -webkit-app-region: drag;
  flex-shrink: 0;
  padding-inline-start: var(--space-xs);
  user-select: none;
}

.titlebar-start {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.titlebar-wp-icon {
  color: var(--color-chrome-fg);
}

.titlebar-app-name {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

.titlebar-menu {
  display: flex;
  align-items: center;
  gap: 0;
  margin-inline-start: var(--space-xs);
}

.titlebar-menu-item {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  padding: var(--space-xxxs) var(--space-xs);
  border-radius: var(--radius-s);
  cursor: default;
  -webkit-app-region: no-drag;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.titlebar-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-chrome-fg);
}

.titlebar-end {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.titlebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: none;
  background: none;
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.titlebar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-chrome-fg);
}

.titlebar-btn--close:hover {
  background: #e81123;
  color: white;
}
</style>
