import { ref, computed, watch, provide, inject, type Ref, type InjectionKey } from 'vue'
import { useSites } from './useSites'
import type { Site } from './types'

/** Default values for all saveable settings */
const DEFAULTS = {
  name: 'Untitled site',
  adminEmail: 'admin@localhost.com',
  adminUsername: 'admin',
  adminPassword: 'pTz8#kL!mQ2xNv',
  phpVersion: '8.3',
  wpVersion: 'latest',
  useCustomDomain: false,
  customDomain: '',
  xdebug: false,
  debugLog: false,
  showErrors: false,
} as const

/** Settings that require a server restart when changed */
const RESTART_KEYS = new Set([
  'phpVersion', 'wpVersion', 'useCustomDomain', 'customDomain',
  'xdebug', 'debugLog', 'showErrors',
])

type SettingsKey = keyof typeof DEFAULTS

const LABELS: Record<SettingsKey, string> = {
  name: 'Site name',
  adminEmail: 'Admin email',
  adminUsername: 'Admin username',
  adminPassword: 'Admin password',
  phpVersion: 'PHP version',
  wpVersion: 'WordPress version',
  useCustomDomain: 'Custom domain',
  customDomain: 'Custom domain',
  xdebug: 'Xdebug',
  debugLog: 'Debug log',
  showErrors: 'Error display',
}

function getSnapshot(site: Site | undefined): Record<SettingsKey, string | boolean> {
  return {
    name: site?.name ?? DEFAULTS.name,
    adminEmail: site?.adminEmail ?? DEFAULTS.adminEmail,
    adminUsername: site?.adminUsername ?? DEFAULTS.adminUsername,
    adminPassword: site?.adminPassword ?? DEFAULTS.adminPassword,
    phpVersion: site?.phpVersion ?? DEFAULTS.phpVersion,
    wpVersion: site?.wpVersion ?? DEFAULTS.wpVersion,
    useCustomDomain: site?.useCustomDomain ?? DEFAULTS.useCustomDomain,
    customDomain: site?.customDomain ?? DEFAULTS.customDomain,
    xdebug: site?.xdebug ?? DEFAULTS.xdebug,
    debugLog: site?.debugLog ?? DEFAULTS.debugLog,
    showErrors: site?.showErrors ?? DEFAULTS.showErrors,
  }
}

/**
 * Tracks working copies of all saveable site settings.
 * Exposes dirty state, save (persist + optional restart), and discard.
 */
export function useSiteSettings(siteId: Ref<string>) {
  const { sites, updateSite, setStatus } = useSites()
  const site = computed(() => sites.value.find(s => s.id === siteId.value))

  // Working refs — what the UI binds to
  const name = ref(DEFAULTS.name)
  const adminEmail = ref(DEFAULTS.adminEmail)
  const adminUsername = ref(DEFAULTS.adminUsername)
  const adminPassword = ref(DEFAULTS.adminPassword)
  const phpVersion = ref(DEFAULTS.phpVersion)
  const wpVersion = ref(DEFAULTS.wpVersion)
  const useCustomDomain = ref(DEFAULTS.useCustomDomain)
  const customDomain = ref(DEFAULTS.customDomain)
  const xdebug = ref(DEFAULTS.xdebug)
  const debugLog = ref(DEFAULTS.debugLog)
  const showErrors = ref(DEFAULTS.showErrors)

  const refs: Record<SettingsKey, Ref<string | boolean>> = {
    name, adminEmail, adminUsername, adminPassword,
    phpVersion, wpVersion, useCustomDomain, customDomain,
    xdebug, debugLog, showErrors,
  }

  // Snapshot of last-saved values for dirty comparison
  const saved = ref<Record<SettingsKey, string | boolean>>(getSnapshot(site.value))

  /** Sync working refs from the site object */
  function syncFromSite() {
    const snap = getSnapshot(site.value)
    for (const key of Object.keys(snap) as SettingsKey[]) {
      refs[key].value = snap[key]
    }
    saved.value = { ...snap }
  }

  // Initialize on site change (e.g. navigating between sites)
  watch(() => siteId.value, () => syncFromSite(), { immediate: true })

  /** Keys that have been changed from saved values */
  const dirtyKeys = computed(() => {
    const keys: SettingsKey[] = []
    for (const key of Object.keys(saved.value) as SettingsKey[]) {
      if (refs[key].value !== saved.value[key]) keys.push(key)
    }
    return keys
  })

  /** Human-readable labels for dirty settings (deduplicated for domain pair) */
  const dirtyLabels = computed(() => {
    const seen = new Set<string>()
    const labels: string[] = []
    for (const key of dirtyKeys.value) {
      const label = LABELS[key]
      if (!seen.has(label)) {
        seen.add(label)
        labels.push(label)
      }
    }
    return labels
  })

  /** Rich change descriptions with before → after values */
  const changeDescriptions = computed(() => {
    const changes: Array<{ label: string; description: string; needsRestart: boolean }> = []
    const seen = new Set<string>()

    for (const key of dirtyKeys.value) {
      const label = LABELS[key]
      if (seen.has(label)) continue
      seen.add(label)

      const from = saved.value[key]
      const to = refs[key].value
      const restart = RESTART_KEYS.has(key)

      if (typeof to === 'boolean') {
        changes.push({ label, description: to ? 'on' : 'off', needsRestart: restart })
      } else if (key === 'phpVersion' || key === 'wpVersion') {
        changes.push({ label, description: `${from} → ${to}`, needsRestart: restart })
      } else if (key === 'adminPassword') {
        changes.push({ label, description: 'changed', needsRestart: restart })
      } else {
        // Show before → after for string values that had a previous value
        const fromStr = String(from)
        const toStr = String(to)
        if (fromStr && fromStr !== toStr) {
          changes.push({ label, description: `${fromStr} → ${toStr}`, needsRestart: restart })
        } else {
          changes.push({ label, description: toStr, needsRestart: restart })
        }
      }
    }
    return changes
  })

  const isDirty = computed(() => dirtyKeys.value.length > 0)

  /** Whether any dirty setting requires a restart */
  const needsRestart = computed(() => dirtyKeys.value.some(k => RESTART_KEYS.has(k)))

  /** Persist all settings and restart if needed */
  async function save() {
    await updateSite(siteId.value, {
      name: name.value as string,
      adminEmail: adminEmail.value as string,
      adminUsername: adminUsername.value as string,
      adminPassword: adminPassword.value as string,
      phpVersion: phpVersion.value as string,
      wpVersion: wpVersion.value as string,
      useCustomDomain: useCustomDomain.value as boolean,
      customDomain: customDomain.value as string,
      xdebug: xdebug.value as boolean,
      debugLog: debugLog.value as boolean,
      showErrors: showErrors.value as boolean,
    })

    const willRestart = needsRestart.value

    // Update saved snapshot
    saved.value = getSnapshot(site.value)

    // Simulate server restart only if restart-requiring settings changed
    if (willRestart) {
      setStatus(siteId.value, 'loading')
      setTimeout(() => {
        setStatus(siteId.value, 'running')
      }, 2000)
    }
  }

  /** Reset working refs back to last-saved values */
  function discard() {
    for (const key of Object.keys(saved.value) as SettingsKey[]) {
      refs[key].value = saved.value[key]
    }
  }

  return {
    // Working refs for UI binding
    name,
    adminEmail,
    adminUsername,
    adminPassword,
    phpVersion,
    wpVersion,
    useCustomDomain,
    customDomain,
    xdebug,
    debugLog,
    showErrors,
    // State
    isDirty,
    needsRestart,
    dirtyLabels,
    changeDescriptions,
    // Actions
    save,
    discard,
  }
}

export type SiteSettingsInstance = ReturnType<typeof useSiteSettings>

const SITE_SETTINGS_KEY: InjectionKey<SiteSettingsInstance> = Symbol('site-settings')

// Module-level reference to the active instance so the router guard can check dirty state
let activeInstance: SiteSettingsInstance | null = null

/** Call from the parent that owns the composable instance */
export function provideSiteSettings(instance: SiteSettingsInstance) {
  provide(SITE_SETTINGS_KEY, instance)
  activeInstance = instance
}

/** Call from child components that need the shared instance */
export function injectSiteSettings(): SiteSettingsInstance {
  const instance = inject(SITE_SETTINGS_KEY)
  if (!instance) throw new Error('useSiteSettings not provided — wrap in provideSiteSettings()')
  return instance
}

/** Check if there are unsaved site settings. Used by the router guard. */
export function hasUnsavedSiteSettings(): boolean {
  return activeInstance?.isDirty.value ?? false
}

/** Discard unsaved site settings. Used by the router guard. */
export function discardUnsavedSiteSettings(): void {
  activeInstance?.discard()
}
