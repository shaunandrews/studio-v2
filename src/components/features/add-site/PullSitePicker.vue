<script setup lang="ts">
import { ref, computed } from 'vue'
import { search, external } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'

export interface RemoteSite {
  id: string
  name: string
  url: string
}

const emit = defineEmits<{
  select: [site: RemoteSite]
  login: []
}>()

const props = defineProps<{
  authenticated: boolean
  sites: RemoteSite[]
}>()

const query = ref('')
const selectedId = ref<string | null>(null)

const filtered = computed(() => {
  if (!query.value) return props.sites
  const q = query.value.toLowerCase()
  return props.sites.filter(s =>
    s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
  )
})

function select(site: RemoteSite) {
  selectedId.value = site.id
  emit('select', site)
}
</script>

<template>
  <div class="pull-site-picker vstack gap-m">
    <!-- Auth gate -->
    <div v-if="!authenticated" class="auth-gate vstack gap-m">
      <div class="auth-info vstack gap-xs">
        <h3 class="auth-title">Connect to WordPress.com</h3>
        <p class="auth-desc">Log in to download a site from WordPress.com or Pressable directly into Studio.</p>
        <ol class="auth-steps vstack gap-xxs">
          <li>Create a new local site</li>
          <li>Pull content from your remote site</li>
          <li>Start working locally</li>
        </ol>
      </div>
      <Button label="Log in to WordPress.com" variant="primary" @click="emit('login')" />
      <a class="auth-link" href="#">New to WordPress.com? Create a free account</a>
    </div>

    <!-- Site list -->
    <template v-else>
      <div class="search-bar">
        <WPIcon :icon="search" :size="20" class="search-icon" />
        <input
          v-model="query"
          class="search-input"
          type="text"
          placeholder="Search your sites..."
        />
      </div>

      <div v-if="filtered.length" class="site-list vstack gap-xxs">
        <button
          v-for="site in filtered"
          :key="site.id"
          class="site-row hstack gap-s"
          :class="{ 'is-selected': site.id === selectedId }"
          @click="select(site)"
        >
          <div class="site-favicon">
            <img :src="`https://s0.wp.com/mshots/v1/${encodeURIComponent(site.url)}?w=32`" :alt="site.name" />
          </div>
          <div class="site-info vstack gap-xxxs">
            <span class="site-name">{{ site.name }}</span>
            <span class="site-url">{{ site.url }}</span>
          </div>
        </button>
      </div>

      <div v-else class="empty-state vstack gap-xs">
        <p class="empty-text">No sites found matching "{{ query }}"</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pull-site-picker {
  width: 100%;
}

/* Auth gate */

.auth-gate {
  align-items: flex-start;
}

.auth-title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
  margin: 0;
}

.auth-desc {
  font-size: var(--font-size-m);
  color: var(--color-chrome-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.auth-steps {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  padding-inline-start: var(--space-m);
  margin: 0;
}

.auth-steps li {
  padding-inline-start: var(--space-xxs);
}

.auth-link {
  font-size: var(--font-size-s);
  color: var(--color-chrome-theme);
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}

/* Search */

.search-bar {
  position: relative;
}

.search-icon {
  position: absolute;
  inset-inline-start: var(--space-xs);
  inset-block-start: 50%;
  transform: translateY(-50%);
  color: var(--color-chrome-fg-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-xs) 0 calc(var(--space-xs) + 24px);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-s);
  background: var(--color-chrome-fill);
  color: var(--color-chrome-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
  outline: none;
  transition: border-color var(--transition-hover);
}

.search-input:focus {
  border-color: var(--color-chrome-theme);
  box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

.search-input::placeholder {
  color: var(--color-chrome-fg-muted);
}

/* Site list */

.site-list {
  max-height: 360px;
  overflow-y: auto;
}

.site-row {
  width: 100%;
  padding: var(--space-xs) var(--space-s);
  border: 2px solid transparent;
  border-radius: var(--radius-s);
  background: var(--color-chrome-fill);
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  align-items: center;
  transition:
    background var(--transition-hover),
    border-color var(--transition-hover);
}

.site-row:hover {
  background: var(--color-chrome-hover);
}

.site-row.is-selected {
  border-color: var(--color-chrome-theme);
  background: color-mix(in srgb, var(--color-chrome-theme) 5%, var(--color-chrome-fill));
}

.site-favicon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-s);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-chrome-hover);
}

.site-favicon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.site-name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-chrome-fg);
}

.site-url {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
}

.empty-text {
  font-size: var(--font-size-m);
  color: var(--color-chrome-fg-muted);
  margin: 0;
}
</style>
