import { AI_SYSTEM_PROMPT } from './ai-system-prompt'

/**
 * Stream an AI response via the server-side proxy.
 */
export async function streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onUpdate: (text: string) => void,
  systemPrompt?: string,
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: systemPrompt ?? AI_SYSTEM_PROMPT,
      }),
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
