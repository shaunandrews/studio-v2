import { ref } from 'vue'
import type {
  SiteContent,
  SiteContentSection,
  SiteContentPage,
  TaskBranch,
  MergeConflict,
  MergeResult,
} from './site-types'
import { useSiteDocument } from './useSiteDocument'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'

// Module-level state (singleton)
const branches = ref<TaskBranch[]>([])

// ---- Key helpers ----

export function contentKey(siteId: string, taskId?: string | null): string {
  return taskId ? `${siteId}:${taskId}` : siteId
}

// ---- Persistence ----

async function persistBranch(branch: TaskBranch) {
  try {
    if (await isDbAvailable()) {
      await db.taskBranches.put(toSerializable(branch))
    }
  } catch (e) {
    console.error('[persistBranch] DB write failed:', e)
  }
}

async function deleteBranch(taskId: string) {
  try {
    if (await isDbAvailable()) {
      await db.taskBranches.delete(taskId)
    }
  } catch (e) {
    console.error('[deleteBranch] DB delete failed:', e)
  }
}

// ---- Fork ----

async function forkForTask(siteId: string, taskId: string) {
  const { getContent, _setContentForKey } = useSiteDocument()
  const mainContent = getContent(siteId).value
  if (!mainContent) return

  const base = toSerializable(mainContent)
  const content = toSerializable(mainContent)
  const key = contentKey(siteId, taskId)
  content.siteId = key

  // Set in-memory
  _setContentForKey(key, content)

  // Persist working copy to siteContent table (under compound key)
  if (await isDbAvailable()) {
    await db.siteContent.put(toSerializable(content))
  }

  // Persist branch record (base snapshot + metadata)
  const branch: TaskBranch = {
    taskId,
    siteId,
    base,
    createdAt: new Date().toISOString(),
  }
  branches.value.push(branch)
  await persistBranch(branch)
}

// ---- Three-way merge: theme ----

function mergeThemeVariables(
  base: Record<string, string>,
  main: Record<string, string>,
  task: Record<string, string>,
): { merged: Record<string, string>; conflicts: MergeConflict[] } {
  const allKeys = new Set([...Object.keys(base), ...Object.keys(main), ...Object.keys(task)])
  const merged: Record<string, string> = {}
  const conflicts: MergeConflict[] = []

  for (const key of allKeys) {
    const b = base[key]
    const m = main[key]
    const t = task[key]

    if (m === t) {
      // Both agree — use that value
      if (m !== undefined) merged[key] = m
    } else if (b === t) {
      // Only main changed — take main
      if (m !== undefined) merged[key] = m
    } else if (b === m) {
      // Only task changed — take task
      if (t !== undefined) merged[key] = t
    } else {
      // Both changed differently — conflict
      conflicts.push({
        id: `conflict-theme-${key}`,
        kind: 'theme-variable',
        path: `theme.${key}`,
        baseValue: b ?? null,
        mainValue: m ?? null,
        taskValue: t ?? null,
      })
      // Default to main's value in merged output
      if (m !== undefined) merged[key] = m
    }
  }

  return { merged, conflicts }
}

// ---- Three-way merge: sections ----

function sectionsEqual(a: SiteContentSection, b: SiteContentSection): boolean {
  return a.html === b.html && a.css === b.css
}

function mergeSections(
  base: Record<string, SiteContentSection>,
  main: Record<string, SiteContentSection>,
  task: Record<string, SiteContentSection>,
): { merged: Record<string, SiteContentSection>; conflicts: MergeConflict[] } {
  const allIds = new Set([...Object.keys(base), ...Object.keys(main), ...Object.keys(task)])
  const merged: Record<string, SiteContentSection> = {}
  const conflicts: MergeConflict[] = []

  for (const id of allIds) {
    const b = base[id]
    const m = main[id]
    const t = task[id]

    // Added in task only
    if (!b && !m && t) {
      merged[id] = { ...t }
      continue
    }
    // Added in main only
    if (!b && m && !t) {
      merged[id] = { ...m }
      continue
    }
    // Added in both — conflict
    if (!b && m && t) {
      conflicts.push({
        id: `conflict-section-${id}-added`,
        kind: 'section-html',
        path: `sections.${id}`,
        baseValue: null,
        mainValue: { html: m.html, css: m.css },
        taskValue: { html: t.html, css: t.css },
      })
      merged[id] = { ...m }
      continue
    }
    // Deleted in task, main unchanged — accept deletion
    if (b && m && !t && sectionsEqual(b, m)) {
      continue
    }
    // Deleted in task, but main changed it — conflict
    if (b && m && !t && !sectionsEqual(b, m)) {
      conflicts.push({
        id: `conflict-section-${id}-deleted-by-task`,
        kind: 'section-deleted',
        path: `sections.${id}`,
        baseValue: { html: b.html, css: b.css },
        mainValue: { html: m.html, css: m.css },
        taskValue: null,
      })
      merged[id] = { ...m }
      continue
    }
    // Deleted in main, task unchanged — accept deletion
    if (b && !m && t && sectionsEqual(b, t)) {
      continue
    }
    // Deleted in main, task changed it — conflict
    if (b && !m && t && !sectionsEqual(b, t)) {
      conflicts.push({
        id: `conflict-section-${id}-deleted-by-main`,
        kind: 'section-deleted',
        path: `sections.${id}`,
        baseValue: { html: b.html, css: b.css },
        mainValue: null,
        taskValue: { html: t.html, css: t.css },
      })
      continue
    }
    // Deleted in both
    if (b && !m && !t) {
      continue
    }
    // Both exist — merge html and css independently
    if (m && t) {
      const mergedSection: SiteContentSection = {
        ...m,
        // Preserve shared/role from whichever side has it
        shared: m.shared || t.shared,
        role: m.role || t.role,
      }

      // HTML
      if (m.html === t.html) {
        mergedSection.html = m.html
      } else if (b?.html === t.html) {
        mergedSection.html = m.html // only main changed
      } else if (b?.html === m.html) {
        mergedSection.html = t.html // only task changed
      } else {
        conflicts.push({
          id: `conflict-section-${id}-html`,
          kind: 'section-html',
          path: `sections.${id}.html`,
          baseValue: b?.html ?? null,
          mainValue: m.html,
          taskValue: t.html,
        })
        mergedSection.html = m.html // default to main
      }

      // CSS
      if (m.css === t.css) {
        mergedSection.css = m.css
      } else if (b?.css === t.css) {
        mergedSection.css = m.css
      } else if (b?.css === m.css) {
        mergedSection.css = t.css
      } else {
        conflicts.push({
          id: `conflict-section-${id}-css`,
          kind: 'section-css',
          path: `sections.${id}.css`,
          baseValue: b?.css ?? null,
          mainValue: m.css,
          taskValue: t.css,
        })
        mergedSection.css = m.css
      }

      merged[id] = mergedSection
    }
  }

  return { merged, conflicts }
}

// ---- Three-way merge: pages ----

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function mergePages(
  base: SiteContentPage[],
  main: SiteContentPage[],
  task: SiteContentPage[],
): { merged: SiteContentPage[]; conflicts: MergeConflict[] } {
  const bySlugs = (pages: SiteContentPage[]) => {
    const map = new Map<string, SiteContentPage>()
    for (const p of pages) map.set(p.slug, p)
    return map
  }

  const baseMap = bySlugs(base)
  const mainMap = bySlugs(main)
  const taskMap = bySlugs(task)
  const allSlugs = new Set([...baseMap.keys(), ...mainMap.keys(), ...taskMap.keys()])

  const merged: SiteContentPage[] = []
  const conflicts: MergeConflict[] = []

  for (const slug of allSlugs) {
    const b = baseMap.get(slug)
    const m = mainMap.get(slug)
    const t = taskMap.get(slug)

    // Added in task only
    if (!b && !m && t) {
      merged.push({ ...t, sections: [...t.sections] })
      continue
    }
    // Added in main only
    if (!b && m && !t) {
      merged.push({ ...m, sections: [...m.sections] })
      continue
    }
    // Added in both — conflict
    if (!b && m && t) {
      conflicts.push({
        id: `conflict-page-${slug}-added`,
        kind: 'page-added',
        path: `pages.${slug}`,
        baseValue: null,
        mainValue: { title: m.title, sections: m.sections },
        taskValue: { title: t.title, sections: t.sections },
      })
      merged.push({ ...m, sections: [...m.sections] })
      continue
    }
    // Deleted in task, main unchanged
    if (b && m && !t && arraysEqual(b.sections, m.sections) && b.title === m.title) {
      continue
    }
    // Deleted in task, main changed — conflict
    if (b && m && !t) {
      conflicts.push({
        id: `conflict-page-${slug}-removed-by-task`,
        kind: 'page-removed',
        path: `pages.${slug}`,
        baseValue: { title: b.title, sections: b.sections },
        mainValue: { title: m.title, sections: m.sections },
        taskValue: null,
      })
      merged.push({ ...m, sections: [...m.sections] })
      continue
    }
    // Deleted in main, task unchanged
    if (b && !m && t && arraysEqual(b.sections, t.sections) && b.title === t.title) {
      continue
    }
    // Deleted in main, task changed — conflict
    if (b && !m && t) {
      conflicts.push({
        id: `conflict-page-${slug}-removed-by-main`,
        kind: 'page-removed',
        path: `pages.${slug}`,
        baseValue: { title: b.title, sections: b.sections },
        mainValue: null,
        taskValue: { title: t.title, sections: t.sections },
      })
      continue
    }
    // Deleted in both
    if (b && !m && !t) {
      continue
    }
    // Both exist — merge title and section order
    if (m && t) {
      const title = (b?.title === m.title) ? t.title : m.title

      let sections: string[]
      const baseChanged = !b || !arraysEqual(b.sections, m.sections)
      const taskChanged = !b || !arraysEqual(b.sections, t.sections)

      if (!baseChanged && !taskChanged) {
        sections = [...m.sections]
      } else if (!taskChanged) {
        sections = [...m.sections] // only main changed
      } else if (!baseChanged) {
        sections = [...t.sections] // only task changed
      } else if (arraysEqual(m.sections, t.sections)) {
        sections = [...m.sections] // both changed the same way
      } else {
        // Both changed differently — conflict
        conflicts.push({
          id: `conflict-page-${slug}-sections`,
          kind: 'section-order',
          path: `pages.${slug}.sections`,
          baseValue: b?.sections ?? null,
          mainValue: m.sections,
          taskValue: t.sections,
        })
        sections = [...m.sections] // default to main
      }

      merged.push({ slug, title, sections })
    }
  }

  // Preserve page ordering: use main's order as base, append new pages from task
  const mainOrder = main.map(p => p.slug)
  const mergedMap = bySlugs(merged)
  const ordered: SiteContentPage[] = []

  for (const slug of mainOrder) {
    const page = mergedMap.get(slug)
    if (page) {
      ordered.push(page)
      mergedMap.delete(slug)
    }
  }
  // Append any remaining (new from task, not in main's order)
  for (const page of mergedMap.values()) {
    ordered.push(page)
  }

  return { merged: ordered, conflicts }
}

// ---- Top-level three-way merge ----

export function threeWayMerge(
  base: SiteContent,
  main: SiteContent,
  task: SiteContent,
): MergeResult {
  const { merged: mergedVars, conflicts: themeConflicts } =
    mergeThemeVariables(base.theme.variables, main.theme.variables, task.theme.variables)

  const { merged: mergedSections, conflicts: sectionConflicts } =
    mergeSections(base.sections, main.sections, task.sections)

  const { merged: mergedPages, conflicts: pageConflicts } =
    mergePages(base.pages, main.pages, task.pages)

  const allConflicts = [...themeConflicts, ...sectionConflicts, ...pageConflicts]

  // Count auto-merged changes (things that differed from base and were resolved without conflict)
  let autoMerged = 0
  // Theme vars that changed
  for (const key of Object.keys(mergedVars)) {
    if (mergedVars[key] !== base.theme.variables[key]) autoMerged++
  }
  // Sections that changed
  for (const id of Object.keys(mergedSections)) {
    const b = base.sections[id]
    if (!b || mergedSections[id].html !== b.html || mergedSections[id].css !== b.css) autoMerged++
  }
  autoMerged -= allConflicts.length // don't double-count conflicts

  const merged: SiteContent = {
    siteId: main.siteId,
    name: main.name,
    theme: {
      fonts: [...new Set([...main.theme.fonts, ...task.theme.fonts])],
      variables: mergedVars,
      darkVariables: main.theme.darkVariables,
    },
    sections: mergedSections,
    pages: mergedPages,
  }

  return {
    merged,
    conflicts: allConflicts,
    autoMergedCount: Math.max(0, autoMerged),
  }
}

// ---- Composable ----

export function useBranches() {
  function getBranch(taskId: string): TaskBranch | null {
    return branches.value.find(b => b.taskId === taskId) ?? null
  }

  function hasBranch(taskId: string): boolean {
    return branches.value.some(b => b.taskId === taskId)
  }

  /**
   * True if the task's fork has diverged from its base (i.e. has actual changes to merge).
   */
  function hasDiverged(taskId: string): boolean {
    const branch = getBranch(taskId)
    if (!branch) return false

    const { getContent } = useSiteDocument()
    const taskContent = getContent(contentKey(branch.siteId, taskId)).value
    if (!taskContent) return false

    const base = branch.base
    // Quick check: compare serialized snapshots
    return JSON.stringify(base.sections) !== JSON.stringify(taskContent.sections)
      || JSON.stringify(base.theme.variables) !== JSON.stringify(taskContent.theme.variables)
      || JSON.stringify(base.pages.map(p => ({ slug: p.slug, title: p.title, sections: p.sections })))
        !== JSON.stringify(taskContent.pages.map(p => ({ slug: p.slug, title: p.title, sections: p.sections })))
  }

  /**
   * Compute merge result for a task without applying it.
   */
  function mergeTask(taskId: string): MergeResult | null {
    const branch = getBranch(taskId)
    if (!branch) return null

    const { getContent } = useSiteDocument()
    const main = getContent(branch.siteId).value
    const taskContent = getContent(contentKey(branch.siteId, taskId)).value
    if (!main || !taskContent) return null

    return threeWayMerge(branch.base, main, taskContent)
  }

  /**
   * Apply a resolved merge to main, then re-fork so the task can keep working.
   */
  async function applyMerge(taskId: string, result: MergeResult) {
    const branch = getBranch(taskId)
    if (!branch) return

    const { _setContentForKey, _removeContent } = useSiteDocument()
    const key = contentKey(branch.siteId, taskId)

    // Overwrite main with merged content
    _setContentForKey(branch.siteId, result.merged)
    if (await isDbAvailable()) {
      await db.siteContent.put(toSerializable(result.merged))
    }

    // Clean up old fork and branch record
    _removeContent(key)
    if (await isDbAvailable()) {
      await db.siteContent.delete(key)
    }
    const idx = branches.value.findIndex(b => b.taskId === taskId)
    if (idx !== -1) branches.value.splice(idx, 1)
    await deleteBranch(taskId)

    // Re-fork from the updated main so the task can continue
    await forkForTask(branch.siteId, taskId)
  }

  /** Hydration setter */
  function _setBranches(records: TaskBranch[]) {
    branches.value = records
  }

  async function resetBranches() {
    branches.value = []
    if (await isDbAvailable()) {
      await db.taskBranches.clear()
    }
  }

  return {
    branches,
    contentKey,
    forkForTask,
    getBranch,
    hasBranch,
    hasDiverged,
    mergeTask,
    applyMerge,
    deleteBranch,
    threeWayMerge,
    _setBranches,
    resetBranches,
  }
}
