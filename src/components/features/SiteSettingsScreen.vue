<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSites } from '@/data/useSites'
import type { GitRepo } from '@/data/types'
import Button from '@/components/primitives/Button.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import { seen as seenIcon, unseen as unseenIcon } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = defineProps<{
  siteId: string
}>()

const { sites, updateSite } = useSites()
const site = computed(() => sites.value.find(p => p.id === props.siteId))

// --- Site settings mock state ---
const siteName = computed({
  get: () => site.value?.name ?? '',
  set: (val: string) => { if (site.value) updateSite(site.value.id, { name: val }) },
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

const phpVersionOptions = [{ label: '', options: ['8.3', '8.2', '8.1', '8.0', '7.4'] }]
const wpVersionOptions = [{ label: '', options: ['latest', '6.9.1', '6.8', '6.7', '6.6'] }]

const mockRepos: GitRepo[] = [
  { provider: 'github', owner: 'downstreet-cafe', name: 'downstreet-theme', defaultBranch: 'main', url: 'https://github.com/downstreet-cafe/downstreet-theme' },
  { provider: 'github', owner: 'downstreet-cafe', name: 'downstreet-plugins', defaultBranch: 'main', url: 'https://github.com/downstreet-cafe/downstreet-plugins' },
  { provider: 'github', owner: 'studio-meridian', name: 'meridian-theme', defaultBranch: 'main', url: 'https://github.com/studio-meridian/meridian-theme' },
]

const showRepoPicker = ref(false)

const mockBranches = ['main', 'staging', 'develop', 'feature/menu-redesign', 'feature/dark-mode']
const branchOptions = [{ label: '', options: mockBranches }]

function connectRepo(repo: GitRepo) {
  if (!site.value) return
  site.value.repo = repo
  showRepoPicker.value = false
  if (site.value.pipeline) {
    const prod = site.value.pipeline.find(s => s.environment === 'production')
    const staging = site.value.pipeline.find(s => s.environment === 'staging')
    if (prod && !prod.branch) prod.branch = repo.defaultBranch
    if (staging && !staging.branch) staging.branch = 'staging'
  }
}

function disconnectRepo() {
  if (!site.value) return
  site.value.repo = undefined
  site.value.localGit = undefined
  if (site.value.pipeline) {
    site.value.pipeline.forEach(s => {
      s.branch = undefined
      s.deployedCommit = undefined
      s.aheadCount = undefined
    })
  }
}

function updateStageBranch(stageId: string, branch: string) {
  const stage = site.value?.pipeline?.find(s => s.id === stageId)
  if (stage) stage.branch = branch
}
</script>

<template>
  <ScreenLayout scrollable>
      <TextInput
        id="site-name"
        v-model="siteName"
        label="Site name"
      />

      <div class="settings__field-row">
        <div class="settings__field">
          <label class="settings__label">PHP version</label>
          <Dropdown
            v-model="phpVersion"
            :groups="phpVersionOptions"
            variant="field"
            width="fill"
            :show-chevron="true"
          />
        </div>
        <div class="settings__field">
          <label class="settings__label">WordPress version</label>
          <Dropdown
            v-model="wpVersion"
            :groups="wpVersionOptions"
            variant="field"
            width="fill"
            :show-chevron="true"
          />
        </div>
      </div>

      <div class="settings__field-row">
        <TextInput
          id="admin-username"
          v-model="adminUsername"
          label="Username"
        />
        <TextInput
          id="admin-password"
          v-model="adminPassword"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
        >
          <template #suffix>
            <button class="settings__input-action" @click="showPassword = !showPassword">
              <WPIcon :icon="showPassword ? unseenIcon : seenIcon" :size="20" />
            </button>
          </template>
        </TextInput>
      </div>

      <TextInput
        id="admin-email"
        v-model="adminEmail"
        type="email"
        label="Email"
        placeholder="admin@localhost.com"
        hint="Defaults to admin@localhost.com if not provided."
      />

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
            <TextInput
              id="custom-domain"
              v-model="customDomain"
              label="Domain name"
              placeholder="my-site.wp.local"
              hint="Your system password will be required to set up the domain."
            />
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
        <div v-if="site?.repo" class="settings__repo-connected">
          <div class="settings__repo-row">
            <div class="settings__repo-info">
              <span class="settings__repo-provider">GitHub</span>
              <a :href="site.repo.url" target="_blank" rel="noopener" class="settings__repo-name">
                {{ site.repo.owner }}/{{ site.repo.name }} &#8599;
              </a>
            </div>
            <button class="settings__disconnect" @click="disconnectRepo">Disconnect</button>
          </div>

          <div v-if="site.pipeline?.length" class="settings__branches">
            <div class="settings__branches-title">Branch mapping</div>
            <div class="settings__branch-row">
              <span class="settings__branch-label">Local</span>
              <span class="settings__branch-value settings__branch-value--auto">
                {{ site.localGit?.branch ?? 'auto-detected' }}
              </span>
            </div>
            <div
              v-for="stage in site.pipeline"
              :key="stage.id"
              class="settings__branch-row"
            >
              <span class="settings__branch-label">{{ stage.label }}</span>
              <Dropdown
                :model-value="stage.branch ?? ''"
                :groups="branchOptions"
                variant="field"
                size="small"
                :show-chevron="true"
                @update:model-value="updateStageBranch(stage.id, $event)"
              />
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

/* ── Form layout ── */

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

.settings__field-row > .text-input {
  flex: 1;
}

.settings__label {
  display: block;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xxs);
}

/* ── Password visibility toggle ── */

.settings__input-action {
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

/* ── Checkbox fields ── */

.settings__toggles {
  margin-block-start: var(--space-m);
}

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
  accent-color: var(--color-frame-theme);
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
  color: var(--color-frame-theme);
  text-decoration: none;
}

.settings__link:hover {
  text-decoration: underline;
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
  color: var(--color-frame-theme);
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
  background: var(--color-frame-hover);
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
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}
</style>
