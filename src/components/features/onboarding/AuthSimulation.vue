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
} from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import { useAuth } from '@/data/useAuth'
import { useOnboarding } from '@/data/useOnboarding'

const router = useRouter()
const { login } = useAuth()
const { markVisited } = useOnboarding()

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
  <div class="oauth-screen">
    <div class="oauth-card">
      <!-- WP logo -->
      <div class="oauth-card__logo">
        <WPIcon :icon="wordpress" :size="40" />
      </div>

      <h1 class="oauth-card__title">Connect WordPress Studio</h1>
      <p class="oauth-card__subtitle">
        Give WordPress Studio access to your WordPress.com account.
      </p>

      <!-- User card -->
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

      <!-- Scopes -->
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

      <!-- Actions -->
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
</template>

<style scoped>
.oauth-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--color-frame-bg);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  overflow-y: auto;
  padding-block: var(--space-xxl);
}

.oauth-card {
  width: 480px;
  max-width: 90vw;
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
