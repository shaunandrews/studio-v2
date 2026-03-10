import Anthropic from '@anthropic-ai/sdk'
import { AI_SYSTEM_PROMPT } from './ai-system-prompt'

const STORAGE_KEY = 'anthropic-api-key'

export function isAIConfigured(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)?.trim()
}

export function getAPIKey(): string {
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
}

export function setAPIKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim())
}

/**
 * Stream an AI response. Calls onUpdate with accumulated text as it arrives.
 */
export async function streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onUpdate: (text: string) => void,
  systemPrompt?: string,
): Promise<string> {
  const apiKey = getAPIKey()
  if (!apiKey) {
    const fallback = "I'm not connected to an AI service yet. Add your Anthropic API key in settings to enable live responses."
    onUpdate(fallback)
    return fallback
  }

  try {
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    })

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt ?? AI_SYSTEM_PROMPT,
      messages,
    })

    let accumulated = ''

    stream.on('text', (text) => {
      accumulated += text
      onUpdate(accumulated)
    })

    await stream.finalMessage()
    onUpdate(accumulated)
    return accumulated
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error calling AI service'
    const errorText = `AI error: ${message}`
    onUpdate(errorText)
    return errorText
  }
}
