import { reactive } from 'vue'

export interface Skill {
  id: string
  name: string
  description: string
  compatibility: string
  installed: boolean
  content?: string
  custom?: boolean
  source?: string
}

const INSTALLED_KEY = 'installed-skills'
const REPO = 'Automattic/agent-skills'

function getInstalledIds(): Set<string> {
  try {
    const stored = localStorage.getItem(INSTALLED_KEY)
    return new Set(stored ? JSON.parse(stored) : ['wordpress-router', 'wp-block-development', 'wp-plugin-development'])
  } catch {
    return new Set()
  }
}

function saveInstalledIds(ids: Set<string>) {
  localStorage.setItem(INSTALLED_KEY, JSON.stringify([...ids]))
}

const installedIds = getInstalledIds()

export const skills: Skill[] = reactive([
  {
    id: 'wordpress-router',
    name: 'wordpress-router',
    description: 'Classify WordPress codebases and route to the correct workflow — plugins, themes, blocks, REST API, WP-CLI, and more.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wordpress-router'),
  },
  {
    id: 'wp-abilities-api',
    name: 'wp-abilities-api',
    description: 'Work with the WordPress Abilities API — wp_register_ability, categories, REST exposure, and permissions checks.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-abilities-api'),
  },
  {
    id: 'wp-block-development',
    name: 'wp-block-development',
    description: 'Develop Gutenberg blocks — block.json, attributes, supports, dynamic rendering, deprecations, and build workflows.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-block-development'),
  },
  {
    id: 'wp-block-themes',
    name: 'wp-block-themes',
    description: 'Develop block themes — theme.json, templates, template parts, patterns, style variations, and Site Editor troubleshooting.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-block-themes'),
  },
  {
    id: 'wp-interactivity-api',
    name: 'wp-interactivity-api',
    description: 'Build with the Interactivity API — data-wp-* directives, store/state/actions, viewScriptModule, and hydration.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-interactivity-api'),
  },
  {
    id: 'wp-performance',
    name: 'wp-performance',
    description: 'Investigate and improve WordPress performance — profiling, query optimization, object caching, cron, and HTTP API.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Prefers WP-CLI (doctor/profile).',
    installed: installedIds.has('wp-performance'),
  },
  {
    id: 'wp-phpstan',
    name: 'wp-phpstan',
    description: 'Configure and run PHPStan in WordPress projects — phpstan.neon, baselines, WordPress typing, third-party plugins.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Requires Composer-based PHPStan.',
    installed: installedIds.has('wp-phpstan'),
  },
  {
    id: 'wp-playground',
    name: 'wp-playground',
    description: 'WordPress Playground workflows — disposable WP instances, blueprints, plugin/theme mounting, and version switching.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Playground CLI requires Node.js 20.18+.',
    installed: installedIds.has('wp-playground'),
  },
  {
    id: 'wp-plugin-development',
    name: 'wp-plugin-development',
    description: 'Develop WordPress plugins — hooks, activation/uninstall, Settings API, data storage, cron, security, and packaging.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-plugin-development'),
  },
  {
    id: 'wp-project-triage',
    name: 'wp-project-triage',
    description: 'Deterministic inspection of WordPress repos — tooling, tests, version hints, and structured JSON reports.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-project-triage'),
  },
  {
    id: 'wp-rest-api',
    name: 'wp-rest-api',
    description: 'Build and debug REST API endpoints — register_rest_route, controllers, schema validation, authentication, and response shaping.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node.',
    installed: installedIds.has('wp-rest-api'),
  },
  {
    id: 'wp-wpcli-and-ops',
    name: 'wp-wpcli-and-ops',
    description: 'WP-CLI operations — search-replace, db export/import, plugin/theme management, cron, cache, multisite, and automation.',
    compatibility: 'WordPress 6.9+ (PHP 7.2.24+). Requires WP-CLI.',
    installed: installedIds.has('wp-wpcli-and-ops'),
  },
  {
    id: 'wpds',
    name: 'wpds',
    description: 'Build UIs with the WordPress Design System — components, tokens, and patterns from WPDS.',
    compatibility: 'Requires WPDS MCP server. WordPress 6.9+ (PHP 7.2.24+).',
    installed: installedIds.has('wpds'),
  },
])

/** Install a single skill (fake async) */
export function installSkill(id: string): Promise<void> {
  const skill = skills.find(s => s.id === id)
  if (!skill) return Promise.resolve()

  return new Promise((resolve) => {
    setTimeout(() => {
      skill.installed = true
      const ids = getInstalledIds()
      ids.add(id)
      saveInstalledIds(ids)
      resolve()
    }, 1200)
  })
}

/** Uninstall a skill */
export function uninstallSkill(id: string) {
  const skill = skills.find(s => s.id === id)
  if (!skill) return
  skill.installed = false
  const ids = getInstalledIds()
  ids.delete(id)
  saveInstalledIds(ids)
}

/** Install all skills (fake async, staggered). Returns an abort function. */
let installAllInterval: ReturnType<typeof setInterval> | null = null

export function installAllSkills(): Promise<void> {
  const uninstalled = skills.filter(s => !s.installed)
  if (!uninstalled.length) return Promise.resolve()

  if (installAllInterval) clearInterval(installAllInterval)

  return new Promise((resolve) => {
    let i = 0
    installAllInterval = setInterval(() => {
      if (i >= uninstalled.length) {
        clearInterval(installAllInterval!)
        installAllInterval = null
        resolve()
        return
      }
      const skill = uninstalled[i]
      skill.installed = true
      const ids = getInstalledIds()
      ids.add(skill.id)
      saveInstalledIds(ids)
      i++
    }, 300)
  })
}

/** Fetch the full SKILL.md content for a skill */
export async function fetchSkillContent(id: string): Promise<string> {
  const skill = skills.find(s => s.id === id)
  if (!skill) return ''
  if (skill.content) return skill.content

  try {
    const resp = await fetch(
      `https://api.github.com/repos/${REPO}/contents/skills/${id}/SKILL.md`,
      { headers: { Accept: 'application/vnd.github.raw+json' } }
    )
    if (!resp.ok) throw new Error(resp.statusText)
    const text = await resp.text()
    skill.content = text
    return text
  } catch {
    return `*Failed to load skill content. View it on [GitHub](https://github.com/${REPO}/tree/trunk/skills/${id}/SKILL.md).*`
  }
}

export const SKILLS_REPO_URL = `https://github.com/${REPO}`

// -- Custom skills --

const CUSTOM_SKILLS_KEY = 'custom-skills'

function getStoredCustomSkills(): Skill[] {
  try {
    const stored = localStorage.getItem(CUSTOM_SKILLS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCustomSkills(customs: Skill[]) {
  localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(customs))
}

// Hydrate custom skills into the main array on load
const storedCustom = getStoredCustomSkills()
for (const cs of storedCustom) {
  if (!skills.find(s => s.id === cs.id)) {
    skills.push({ ...cs, installed: true })
  }
}

/** Add a custom skill from a filename (upload). Returns the skill id. */
export function addCustomSkillFromFile(filename: string): string | undefined {
  const name = filename.replace(/\.(md|zip)$/i, '')
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
  if (skills.find(s => s.id === id)) return undefined

  const skill: Skill = {
    id,
    name,
    description: `Custom skill uploaded from ${filename}`,
    compatibility: 'User-provided',
    installed: true,
    custom: true,
    source: filename,
  }
  skills.push(skill)

  const customs = getStoredCustomSkills()
  customs.push(skill)
  saveCustomSkills(customs)
  return id
}

/** Add a custom skill from a URL. Returns the skill id. */
export function addCustomSkillFromURL(url: string): string | undefined {
  const segments = url.replace(/\/+$/, '').split('/')
  const name = segments[segments.length - 1].replace(/\.(md|zip)$/i, '') || 'unknown-skill'
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
  if (skills.find(s => s.id === id)) return undefined

  const skill: Skill = {
    id,
    name,
    description: `Custom skill from ${url}`,
    compatibility: 'User-provided',
    installed: true,
    custom: true,
    source: url,
  }
  skills.push(skill)

  const customs = getStoredCustomSkills()
  customs.push(skill)
  saveCustomSkills(customs)
  return id
}

/** Remove a custom skill */
export function removeCustomSkill(id: string) {
  const idx = skills.findIndex(s => s.id === id)
  if (idx !== -1) skills.splice(idx, 1)

  const customs = getStoredCustomSkills().filter(s => s.id !== id)
  saveCustomSkills(customs)
}
