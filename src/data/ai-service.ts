import { AI_SYSTEM_PROMPT } from './ai-system-prompt'

/**
 * Stream an AI response via the server-side proxy.
 */
export async function streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onUpdate: (text: string) => void,
  systemPrompt?: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: systemPrompt ?? AI_SYSTEM_PROMPT,
      }),
      signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }))
      const errorText = `AI error: ${err.error ?? response.statusText}`
      onUpdate(errorText)
      return errorText
    }

    const reader = response.body?.getReader()
    if (!reader) {
      const errorText = 'AI error: No response stream'
      onUpdate(errorText)
      return errorText
    }

    const decoder = new TextDecoder()
    let accumulated = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6)
        try {
          const event = JSON.parse(json)
          if (event.type === 'text') {
            accumulated += event.text
            onUpdate(accumulated)
          } else if (event.type === 'error') {
            const errorText = `AI error: ${event.error}`
            onUpdate(errorText)
            return errorText
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    onUpdate(accumulated)
    return accumulated
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error calling AI service'
    const errorText = `AI error: ${message}`
    onUpdate(errorText)
    return errorText
  }
}

// ---- Tool-aware streaming ----

interface ToolUseResult {
  id: string
  name: string
  input: Record<string, any>
}

interface StreamCallbacks {
  onText: (accumulated: string) => void
  onToolUseStart: (id: string, name: string) => void
  onToolUseComplete: (toolUse: ToolUseResult) => void
}

interface StreamResult {
  stopReason: string
  text: string
  toolUses: ToolUseResult[]
}

export async function streamAIWithTools(
  messages: Array<{ role: string; content: any }>,
  tools: any[],
  system: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<StreamResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, tools, system }),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }))
    const errorText = `AI error: ${err.error ?? response.statusText}`
    callbacks.onText(errorText)
    return { stopReason: 'error', text: errorText, toolUses: [] }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onText('AI error: No response stream')
    return { stopReason: 'error', text: '', toolUses: [] }
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let accumulatedText = ''
  let stopReason = 'end_turn'

  const toolUses: ToolUseResult[] = []
  let currentToolId = ''
  let currentToolName = ''
  let currentToolJson = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))

        switch (event.type) {
          case 'text':
            accumulatedText += event.text
            callbacks.onText(accumulatedText)
            break

          case 'tool_use_start':
            currentToolId = event.id
            currentToolName = event.name
            currentToolJson = ''
            callbacks.onToolUseStart(event.id, event.name)
            break

          case 'tool_use_delta':
            currentToolJson += event.partial_json
            break

          case 'content_block_stop':
            if (currentToolId) {
              const input = currentToolJson ? JSON.parse(currentToolJson) : {}
              const toolUse = { id: currentToolId, name: currentToolName, input }
              toolUses.push(toolUse)
              callbacks.onToolUseComplete(toolUse)
              currentToolId = ''
              currentToolName = ''
              currentToolJson = ''
            }
            break

          case 'done':
            stopReason = event.stop_reason ?? 'end_turn'
            break
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { stopReason, text: accumulatedText, toolUses }
}

/**
 * Generate a task title via the proxy.
 */
export async function generateTitle(userMessage: string): Promise<string | null> {
  const prompt = `Generate a very short title (2-5 words, no quotes) for a task described as: "${userMessage}"`

  try {
    const response = await fetch('/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.title || null
  } catch {
    return null
  }
}
