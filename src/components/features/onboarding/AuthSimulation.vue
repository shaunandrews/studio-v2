<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  wordpress,
  people,
  postList,
  comment,
  tag,
  plus,
  bell,
  chartBar,
  media,
  menu,
  lock,
} from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import { useAuth } from '@/data/useAuth'
import { useOnboarding } from '@/data/useOnboarding'
import { useOperatingSystem } from '@/data/useOperatingSystem'

const router = useRouter()
const { login } = useAuth()
const { markVisited } = useOnboarding()
const { isMac } = useOperatingSystem()

markVisited('oauth')

const isLoading = ref(false)

const scopes = [
  { icon: people, label: 'Personal details' },
  { icon: postList, label: 'Posts' },
  { icon: comment, label: 'Comments' },
  { icon: tag, label: 'Tags and categories' },
  { icon: plus, label: 'Blog follows' },
  { icon: bell, label: 'Notifications' },
  { icon: chartBar, label: 'Stats' },
  { icon: media, label: 'Media' },
  { icon: menu, label: 'Menus' },
]

async function handleApprove() {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  login({
    name: 'Shaun Andrews',
    email: 'shaun@automattic.com',
    avatar: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
  })
  isLoading.value = false
  router.push('/permissions')
}

function handleDeny() {
  router.back()
}
</script>

<template>
  <div class="oauth-backdrop">
    <div class="browser-window" :class="{ 'is-mac': isMac }">
      <!-- macOS titlebar -->
      <div v-if="isMac" class="browser-titlebar browser-titlebar--mac">
        <div class="mac-lights">
          <span class="mac-light mac-light--close" />
          <span class="mac-light mac-light--minimize" />
          <span class="mac-light mac-light--maximize" />
        </div>
        <div class="browser-url-bar">
          <WPIcon :icon="lock" :size="14" class="browser-url-bar__lock" />
          <span class="browser-url-bar__url">public-api.wordpress.com</span>
        </div>
        <div class="mac-lights-spacer" />
      </div>

      <!-- Windows titlebar -->
      <div v-else class="browser-titlebar browser-titlebar--win">
        <div class="browser-url-bar">
          <WPIcon :icon="lock" :size="14" class="browser-url-bar__lock" />
          <span class="browser-url-bar__url">public-api.wordpress.com</span>
        </div>
        <div class="win-controls">
          <button class="win-btn">
            <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
          </button>
          <button class="win-btn">
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1" /></svg>
          </button>
          <button class="win-btn win-btn--close">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" /></svg>
          </button>
        </div>
      </div>

      <!-- Page content -->
      <div class="browser-content">
        <div class="oauth-card">
          <div class="oauth-card__logo">
            <WPIcon :icon="wordpress" :size="40" />
          </div>

          <h1 class="oauth-card__title">Connect WordPress Studio</h1>
          <p class="oauth-card__subtitle">
            Give WordPress Studio access to your WordPress.com account.
          </p>

          <div class="oauth-card__user">
            <img
              class="oauth-card__avatar"
              src="https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=128"
              alt="User"
            />
            <div class="oauth-card__user-info">
              <span class="oauth-card__user-name">Shaun Andrews</span>
              <span class="oauth-card__user-meta">shaunandrews - 733 sites</span>
            </div>
          </div>

          <a href="#" class="oauth-card__link" @click.prevent>Log in with a different account</a>

          <p class="oauth-card__scopes-label">Studio is requesting access to:</p>
          <div class="oauth-card__scopes">
            <div
              v-for="scope in scopes"
              :key="scope.label"
              class="oauth-card__scope"
            >
              <WPIcon :icon="scope.icon" :size="20" />
              <span>{{ scope.label }}</span>
            </div>
          </div>

          <a href="#" class="oauth-card__link" @click.prevent>Learn more about how Studio uses your data</a>

          <div class="oauth-card__actions">
            <Button
              variant="secondary"
              label="Deny"
              width="full"
              @click="handleDeny"
            />
            <Button
              variant="primary"
              :label="isLoading ? 'Approving...' : 'Approve'"
              width="full"
              :disabled="isLoading"
              @click="handleApprove"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Backdrop: theme accent behind the browser window ── */

.oauth-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-theme-bg);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  padding: var(--space-xxl);
}

/* ── Simulated browser window ── */

.browser-window {
  width: 560px;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* ── macOS titlebar ── */

.browser-titlebar--mac {
  display: flex;
  align-items: center;
  height: 52px;
  padding-inline: var(--space-m);
  background: var(--color-frame-bg);
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.mac-lights {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 68px;
  flex-shrink: 0;
}

.mac-light {
  width: 12px; /* OS-native size */
  height: 12px;
  border-radius: 50%;
}

.mac-light--close { background: var(--color-macos-close); }
.mac-light--minimize { background: var(--color-macos-minimize); }
.mac-light--maximize { background: var(--color-macos-maximize); }

.mac-lights-spacer {
  width: 68px;
  flex-shrink: 0;
}

/* ── Windows titlebar ── */

.browser-titlebar--win {
  display: flex;
  align-items: center;
  height: 40px;
  padding-inline-start: var(--space-m);
  background: var(--color-frame-bg);
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.win-controls {
  display: flex;
  align-items: stretch;
  height: 100%;
  margin-inline-start: auto;
}

.win-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: none;
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: default;
}

.win-btn:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.win-btn--close:hover {
  background: #e81123;
  color: white;
}

/* ── Shared URL bar ── */

.browser-url-bar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xxs);
  height: 28px;
  background: var(--color-frame-fill);
  border-radius: var(--radius-s);
  padding-inline: var(--space-s);
}

.browser-url-bar__lock {
  color: var(--color-frame-fg-muted);
  flex-shrink: 0;
}

.browser-url-bar__url {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

/* ── Browser content (scrollable page) ── */

.browser-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: var(--space-xxl) var(--space-xl);
}

/* ── OAuth card (page content) ── */

.oauth-card {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.oauth-card__logo {
  width: 56px;
  height: 56px;
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
  border-radius: var(--radius-m);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: var(--space-l);
}

.oauth-card__title {
  font-size: 24px;
  font-weight: var(--font-weight-regular);
  color: var(--color-frame-fg);
  margin: 0 0 var(--space-xs);
  text-align: center;
}

.oauth-card__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0 0 var(--space-xl);
  text-align: center;
}

.oauth-card__user {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  width: 100%;
  padding: var(--space-m);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  margin-block-end: var(--space-m);
}

.oauth-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-s);
  object-fit: cover;
  flex-shrink: 0;
}

.oauth-card__user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.oauth-card__user-name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.oauth-card__user-meta {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

.oauth-card__link {
  font-size: var(--font-size-s);
  color: var(--color-frame-theme);
  text-decoration: none;
  align-self: flex-start;
  margin-block-end: var(--space-xl);
}

.oauth-card__link:hover {
  text-decoration: underline;
}

.oauth-card__scopes-label {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  margin: 0 0 var(--space-m);
  align-self: flex-start;
}

.oauth-card__scopes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m) var(--space-xl);
  width: 100%;
  margin-block-end: var(--space-xl);
}

.oauth-card__scope {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
}

.oauth-card__scope :deep(svg) {
  flex-shrink: 0;
  color: var(--color-frame-fg);
}

.oauth-card__actions {
  display: flex;
  gap: var(--space-m);
  width: 100%;
  margin-block-start: var(--space-m);
}
</style>
