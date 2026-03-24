import { computed, ref } from 'vue'
import type { Revision, RevisionChange, SiteContent } from './site-types'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'
import { useSiteDocument } from './useSiteDocument'

// Module-level state (singleton)
const revisions = ref<Revision[]>([])

// ---- Persistence ----

async function persistRevision(revision: Revision) {
  try {
    if (await isDbAvailable()) {
      await db.revisions.put(toSerializable(revision))
    }
  } catch (e) {
    console.error('[persistRevision] DB write failed:', e)
  }
}

// ---- Helpers ----

function makeRevisionId(): string {
  return `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function buildLabel(changes: RevisionChange[]): string {
  if (changes.length === 0) return 'No changes'
  const labels = changes.map(c => c.label)
  if (labels.length <= 3) return labels.join(', ')
  return `${labels.slice(0, 3).join(', ')} + ${labels.length - 3} more`
}

// ---- Composable ----

export function useRevisions() {
  const { getContent } = useSiteDocument()

  async function createRevision(
    siteId: string,
    taskId: string,
    messageId: string,
    turnChanges: RevisionChange[],
  ): Promise<Revision | null> {
    const content = getContent(siteId).value
    if (!content) return null

    const revision: Revision = {
      id: makeRevisionId(),
      siteId,
      taskId,
      messageId,
      changes: turnChanges,
      label: buildLabel(turnChanges),
      snapshot: toSerializable(content),
      timestamp: new Date().toISOString(),
    }

    revisions.value = [...revisions.value, revision]
    await persistRevision(revision)
    return revision
  }

  function getRevisionsForSite(siteId: string | null) {
    return computed(() =>
      revisions.value
        .filter(r => r.siteId === siteId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    )
  }

  function getRevisionsForTask(taskId: string | null) {
    return computed(() =>
      revisions.value
        .filter(r => r.taskId === taskId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    )
  }

  function getRevisionSnapshot(revisionId: string): SiteContent | null {
    const rev = revisions.value.find(r => r.id === revisionId)
    return rev?.snapshot ?? null
  }

  function _setRevisions(records: Revision[]) {
    revisions.value = records
  }

  async function resetRevisions() {
    revisions.value = []
    try {
      if (await isDbAvailable()) {
        await db.revisions.clear()
      }
    } catch (e) {
      console.error('[resetRevisions] DB clear failed:', e)
    }
  }

  return {
    revisions,
    createRevision,
    getRevisionsForSite,
    getRevisionsForTask,
    getRevisionSnapshot,
    _setRevisions,
    resetRevisions,
  }
}
