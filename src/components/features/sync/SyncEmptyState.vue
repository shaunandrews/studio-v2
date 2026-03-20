<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'

defineEmits<{
  setup: []
}>()
</script>

<template>
  <div class="sync-empty">
    <div class="sync-empty__illustration">
      <div class="sync-empty__env sync-empty__env--local">Local</div>
      <div class="sync-empty__env sync-empty__env--staging">Staging</div>
      <div class="sync-empty__env sync-empty__env--production">Production</div>
    </div>

    <div class="sync-empty__message">
      <div class="sync-empty__copy">
        <p class="sync-empty__heading">Build locally, publish confidently</p>
        <p class="sync-empty__subtext">
          Develop on your local site, push to staging to preview and test, then promote to production when it's ready for visitors.
        </p>
      </div>

      <Button
        variant="primary"
        label="Setup Sync"
        @click="$emit('setup')"
      />
    </div>
  </div>
</template>

<style scoped>
.sync-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xxl);
  padding: var(--space-m) var(--space-l);
}

/* ── Illustration ── */

.sync-empty__illustration {
  position: relative;
  width: 320px;
  height: 114px;
  border-radius: var(--radius-l);
  background:
    radial-gradient(ellipse 320px 114px at center, transparent 60%, rgba(0, 0, 0, 0.06) 100%),
    rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.sync-empty__env {
  position: absolute;
  width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-m);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: translate 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sync-empty__env--local {
  inset-block-start: 15px;
  inset-inline-start: 15px;
  background: var(--color-env-local-bg);
}

.sync-empty__env--staging {
  inset-block-start: 50%;
  inset-inline-start: 105px;
  translate: 0 -50%;
  background: var(--color-env-staging-bg);
}

.sync-empty__env--production {
  inset-block-end: 15px;
  inset-inline-start: 195px;
  background: var(--color-env-production-bg);
}

.sync-empty__illustration:hover .sync-empty__env--local {
  translate: 20px 8px;
}

.sync-empty__illustration:hover .sync-empty__env--staging {
  translate: 0 -50%;
}

.sync-empty__illustration:hover .sync-empty__env--production {
  translate: -20px -8px;
}

/* ── Message ── */

.sync-empty__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  width: 100%;
  max-width: 400px;
}

.sync-empty__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  text-align: center;
}

.sync-empty__heading {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.sync-empty__subtext {
  font-size: var(--font-size-m);
  line-height: var(--line-height-normal);
  color: var(--color-frame-fg-muted);
  margin: 0;
}
</style>
