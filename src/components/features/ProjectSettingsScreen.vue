<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjects } from '@/data/useProjects'
import type { GitRepo } from '@/data/types'
import Button from '@/components/primitives/Button.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import { seen as seenIcon, unseen as unseenIcon } from '@wordpress/icons'
import WPIcon from '@shared/primitives/WPIcon.vue'

const props = defineProps<{
  projectId: string
}>()

const { projects, updateProject } = useProjects()
const project = computed(() => projects.value.find(p => p.id === props.projectId))

// --- Site settings mock state ---
const siteName = computed({
  get: () => project.value?.name ?? '',
  set: (val: string) => { if (project.value) updateProject(project.value.id, { name: val }) },
})
const phpVersion = ref('8.3')
const wpVersion = ref('latest')
const useCustomDomain = ref(false)
const customDomain = ref('downstreet-cafe.wp.local')
const enableHttps = ref(false)

// Admin credentials
const adminUsername = ref('admin')
const adminPassword = ref('pTz8#kL!mQ2xNv')
const adminEmail = ref('admin@localhost.com')
const showPassword = ref(false)

// Debugging
const enableXdebug = ref(false)
const enableDebugLog = ref(false)
const showErrorsInBrowser = ref(false)

const mockRepos: GitRepo[] = [
  { provider: 'github', owner: 'downstreet-cafe', name: 'downstreet-theme', defaultBranch: 'main', url: 'https://github.com/downstreet-cafe/downstreet-theme' },
  { provider: 'github', owner: 'downstreet-cafe', name: 'downstreet-plugins', defaultBranch: 'main', url: 'https://github.com/downstreet-cafe/downstreet-plugins' },
  { provider: 'github', owner: 'studio-meridian', name: 'meridian-theme', defaultBranch: 'main', url: 'https://github.com/studio-meridian/meridian-theme' },
]

const showRepoPicker = ref(false)

const mockBranches = ['main', 'staging', 'develop', 'feature/menu-redesign', 'feature/dark-mode']

function connectRepo(repo: GitRepo) {
  if (!project.value) return
  project.value.repo = repo
  showRepoPicker.value = false
  if (project.value.pipeline) {
    const prod = project.value.pipeline.find(s => s.environment === 'production')
    const staging = project.value.pipeline.find(s => s.environment === 'staging')
    if (prod && !prod.branch) prod.branch = repo.defaultBranch
    if (staging && !staging.branch) staging.branch = 'staging'
  }
}

function disconnectRepo() {
  if (!project.value) return
  project.value.repo = undefined
  project.value.localGit = undefined
  if (project.value.pipeline) {
    project.value.pipeline.forEach(s => {
      s.branch = undefined
      s.deployedCommit = undefined
      s.aheadCount = undefined
    })
  }
}

function updateStageBranch(stageId: string, branch: string) {
  const stage = project.value?.pipeline?.find(s => s.id === stageId)
  if (stage) stage.branch = branch
}
</script>

<template>
  <ScreenLayout
    title="Settings"
    subtitle="Configure your local WordPress environment."
    scrollable
  >
      <!-- Editable fields -->
      <div class="settings__field">
        <label class="settings__label" for="site-name">Site name</label>
        <input
          id="site-name"
          v-model="siteName"
          type="text"
          class="settings__input"
        />
      </div>

      <div class="settings__field-row">
        <div class="settings__field">
          <label class="settings__label" for="php-version">PHP version</label>
          <select id="php-version" v-model="phpVersion" class="settings__select">
            <option value="8.3">8.3</option>
            <option value="8.2">8.2</option>
            <option value="8.1">8.1</option>
            <option value="8.0">8.0</option>
            <option value="7.4">7.4</option>
          </select>
        </div>
        <div class="settings__field">
          <label class="settings__label" for="wp-version">WordPress version</label>
          <select id="wp-version" v-model="wpVersion" class="settings__select">
            <option value="latest">latest</option>
            <option value="6.9.1">6.9.1</option>
            <option value="6.8">6.8</option>
            <option value="6.7">6.7</option>
            <option value="6.6">6.6</option>
          </select>
        </div>
      </div>

      <div class="settings__field-row">
        <div class="settings__field">
          <label class="settings__label" for="admin-username">Username</label>
          <input
            id="admin-username"
            v-model="adminUsername"
            type="text"
            class="settings__input"
          />
        </div>
        <div class="settings__field">
          <label class="settings__label" for="admin-password">Password</label>
          <div class="settings__input-with-action">
            <input
              id="admin-password"
              v-model="adminPassword"
              :type="showPassword ? 'text' : 'password'"
              class="settings__input settings__input--has-action"
            />
            <button class="settings__input-action" @click="showPassword = !showPassword">
              <WPIcon :icon="showPassword ? unseenIcon : seenIcon" :size="20" />
            </button>
          </div>
        </div>
      </div>

      <div class="settings__field">
        <label class="settings__label" for="admin-email">Email</label>
        <input
          id="admin-email"
          v-model="adminEmail"
          type="email"
          class="settings__input"
          placeholder="admin@localhost.com"
        />
        <p class="settings__hint">Defaults to admin@localhost.com if not provided.</p>
      </div>

      <!-- Toggles -->
      <div class="settings__toggles">
        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="useCustomDomain" class="settings__checkbox" />
            Use custom domain
          </label>
        </div>

        <template v-if="useCustomDomain">
          <div class="settings__field settings__field--indented">
            <label class="settings__label" for="custom-domain">Domain name</label>
            <input
              id="custom-domain"
              v-model="customDomain"
              type="text"
              class="settings__input"
              placeholder="my-site.wp.local"
            />
            <p class="settings__hint">Your system password will be required to set up the domain.</p>
          </div>
        </template>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="enableHttps" class="settings__checkbox" />
            Enable HTTPS
          </label>
          <p class="settings__hint">Requires trusting the Studio certificate authority in your keychain. <a href="#" class="settings__link" @click.prevent>Learn how</a></p>
        </div>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="enableXdebug" class="settings__checkbox" />
            Enable Xdebug
          </label>
          <p class="settings__hint">Only one site at a time. May slow down performance.</p>
        </div>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="enableDebugLog" class="settings__checkbox" />
            Enable debug log
          </label>
        </div>

        <div class="settings__checkbox-field">
          <label class="settings__checkbox-label">
            <input type="checkbox" v-model="showErrorsInBrowser" class="settings__checkbox" />
            Show errors in browser
          </label>
        </div>
      </div>

      <!-- Repository -->
      <div class="settings__repo">
        <div v-if="project?.repo" class="settings__repo-connected">
          <div class="settings__repo-row">
            <div class="settings__repo-info">
              <span class="settings__repo-provider">GitHub</span>
              <a :href="project.repo.url" target="_blank" rel="noopener" class="settings__repo-name">
                {{ project.repo.owner }}/{{ project.repo.name }} &#8599;
              </a>
            </div>
            <button class="settings__disconnect" @click="disconnectRepo">Disconnect</button>
          </div>

          <div v-if="project.pipeline?.length" class="settings__branches">
            <div class="settings__branches-title">Branch mapping</div>
            <div class="settings__branch-row">
              <span class="settings__branch-label">Local</span>
              <span class="settings__branch-value settings__branch-value--auto">
                {{ project.localGit?.branch ?? 'auto-detected' }}
              </span>
            </div>
            <div
              v-for="stage in project.pipeline"
              :key="stage.id"
              class="settings__branch-row"
            >
              <span class="settings__branch-label">{{ stage.label }}</span>
              <select
                :value="stage.branch ?? ''"
                class="settings__branch-select"
                @change="updateStageBranch(stage.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="" disabled>Select branch</option>
                <option v-for="b in mockBranches" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
          </div>
        </div>

        <div v-else class="settings__repo-empty">
          <p class="settings__repo-hint">Connect a GitHub repository to track branches and deployments across your pipeline stages.</p>
          <Button
            v-if="!showRepoPicker"
            variant="secondary"
            label="Connect GitHub repo"
            @click="showRepoPicker = true"
          />

          <div v-if="showRepoPicker" class="settings__repo-picker">
            <div class="settings__picker-title">Select a repository</div>
            <button
              v-for="repo in mockRepos"
              :key="repo.url"
              class="settings__picker-item"
              @click="connectRepo(repo)"
            >
              <span class="settings__picker-owner">{{ repo.owner }}</span>
              <span class="settings__picker-slash">/</span>
              <span class="settings__picker-name">{{ repo.name }}</span>
            </button>
            <button class="settings__picker-cancel" @click="showRepoPicker = false">Cancel</button>
          </div>
        </div>
      </div>
  </ScreenLayout>
</template>

<style scoped>

/* ── Form fields ── */

.settings__field {
  margin-block-end: var(--space-s);
}

.settings__field--indented {
  padding-inline-start: var(--space-l);
}

.settings__field-row {
  display: flex;
  gap: var(--space-s);
  margin-block-end: var(--space-s);
}

.settings__field-row > .settings__field {
  flex: 1;
  margin-block-end: 0;
}

.settings__label {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xxs);
}

.settings__input {
  display: block;
  width: 100%;
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  padding: var(--space-xs) var(--space-xs);
  outline: none;
  transition: border-color var(--duration-instant) var(--ease-default);
  box-sizing: border-box;
}

.settings__input::placeholder {
  color: var(--color-frame-fg-muted);
}

.settings__input:hover {
  border-color: var(--color-frame-fg-muted);
}

.settings__input:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.settings__select {
  display: block;
  width: 100%;
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  padding: var(--space-xs);
  padding-inline-end: var(--space-l);
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23646970' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color var(--duration-instant) var(--ease-default);
  box-sizing: border-box;
}

.settings__select:hover {
  border-color: var(--color-frame-fg-muted);
}

.settings__select:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

/* ── Checkbox fields ── */

.settings__checkbox-field {
  margin-block-end: var(--space-s);
}

.settings__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  cursor: pointer;
}

.settings__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.settings__hint {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  margin: var(--space-xxxs) 0 0;
  line-height: 1.5;
}

.settings__checkbox-field .settings__hint {
  padding-inline-start: calc(16px + var(--space-xxs));
}

.settings__link {
  color: var(--color-primary);
  text-decoration: none;
}

.settings__link:hover {
  text-decoration: underline;
}

/* ── Input with inline action (password visibility) ── */

.settings__input-with-action {
  position: relative;
}

.settings__input--has-action {
  padding-inline-end: var(--space-xl);
}

.settings__input-action {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--space-xxs);
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  padding: var(--space-xxxs);
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-instant) var(--ease-default);
}

.settings__input-action:hover {
  color: var(--color-frame-fg);
}

.settings__input-action.is-copied {
  color: var(--color-primary);
}

/* ── Toggles ── */

.settings__toggles {
  margin-block-start: var(--space-m);
}

/* ── Repository ── */

.settings__repo {
  margin-block-start: var(--space-l);
}

.settings__repo-connected {
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  padding: var(--space-s) var(--space-m);
  background: var(--color-frame-bg);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.settings__repo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings__repo-info {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
}

.settings__repo-provider {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
}

.settings__repo-name {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  text-decoration: none;
}

.settings__repo-name:hover {
  text-decoration: underline;
}

.settings__disconnect {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  transition: color var(--duration-instant) var(--ease-default);
}

.settings__disconnect:hover {
  color: var(--color-frame-fg);
}

.settings__branches {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.settings__branches-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-block-end: var(--space-xxxs);
}

.settings__branch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
}

.settings__branch-label {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
}

.settings__branch-value {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg);
  font-family: monospace;
}

.settings__branch-value--auto {
  color: var(--color-frame-fg-muted);
  font-style: italic;
}

.settings__branch-select {
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--color-frame-fg);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  padding: var(--space-xxxs) var(--space-xs);
  padding-inline-end: var(--space-s);
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23646970' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
}

.settings__branch-select:hover {
  border-color: var(--color-frame-fg-muted);
}

.settings__branch-select:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.settings__repo-empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.settings__repo-hint {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.settings__repo-picker {
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
  overflow: hidden;
}

.settings__picker-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--space-s) var(--space-m) var(--space-xxs);
}

.settings__picker-item {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: var(--space-xxs) var(--space-m);
  border: none;
  background: none;
  cursor: pointer;
  font-family: monospace;
  font-size: var(--font-size-s);
  text-align: start;
  transition: background var(--duration-instant) var(--ease-default);
}

.settings__picker-item:hover {
  background: var(--color-frame-bg-secondary);
}

.settings__picker-owner {
  color: var(--color-frame-fg-muted);
}

.settings__picker-slash {
  color: var(--color-frame-fg-muted);
}

.settings__picker-name {
  color: var(--color-frame-fg);
  font-weight: var(--font-weight-medium);
}

.settings__picker-cancel {
  display: block;
  width: 100%;
  padding: var(--space-xxs) var(--space-m);
  border: none;
  border-block-start: 1px solid var(--color-frame-border);
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  text-align: center;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.settings__picker-cancel:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}
</style>
