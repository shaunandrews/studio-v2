import type { Message, Task } from './types'
import type { Revision, RevisionChange, SiteContent } from './site-types'

function makeRevisionId(timestamp: string): string {
  const ts = new Date(timestamp).getTime()
  return `rev-${ts}-${Math.random().toString(36).slice(2, 7)}`
}

function buildLabel(changes: RevisionChange[]): string {
  if (changes.length === 0) return 'No changes'
  const labels = changes.map(c => c.label)
  if (labels.length <= 3) return labels.join(', ')
  return `${labels.slice(0, 3).join(', ')} + ${labels.length - 3} more`
}

/**
 * Generate seed revisions by scanning messages for tool calls.
 * One revision per agent message that contains at least one successful tool call.
 * All snapshots use the final template-derived SiteContent (we can't reconstruct
 * intermediate states, but this is good enough for demo purposes).
 */
export function generateSeedRevisions(
  messages: Message[],
  tasks: Task[],
  contentMap: Record<string, SiteContent>,
): Revision[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  const revisions: Revision[] = []

  for (const msg of messages) {
    if (msg.role !== 'agent') continue
    if (!msg.toolCalls?.length) continue

    const task = taskMap.get(msg.taskId)
    if (!task) continue

    const content = contentMap[task.siteId]
    if (!content) continue

    // Only include successful tool calls
    const doneChanges: RevisionChange[] = msg.toolCalls
      .filter(tc => tc.status === 'done')
      .map(tc => ({
        toolCallId: tc.id,
        toolName: tc.toolName ?? tc.label,
        label: tc.label,
      }))

    if (doneChanges.length === 0) continue

    revisions.push({
      id: makeRevisionId(msg.timestamp),
      siteId: task.siteId,
      taskId: task.id,
      messageId: msg.id,
      changes: doneChanges,
      label: buildLabel(doneChanges),
      snapshot: JSON.parse(JSON.stringify(content)),
      timestamp: msg.timestamp,
    })
  }

  return revisions
}
