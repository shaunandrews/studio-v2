import Anthropic from '@anthropic-ai/sdk'
import { AI_SYSTEM_PROMPT } from './ai-system-prompt'
import type { ContentBlock, CardBlock } from './types'

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

const CARD_TYPES = ['plugin', 'settings', 'progress', 'page', 'postDraft'] as const
type CardType = typeof CARD_TYPES[number]

/** Fence regex — matches card:TYPE fenced code blocks */
const CARD_FENCE_REGEX = /```(card:[\w-]+)\s*\n([\s\S]*?)```/g
const CARD_PARTIAL_FENCE_REGEX = /```card:[\w-]+\s*\n[^]*$/

/**
 * Parse AI response into ContentBlock[].
 * Extracts card:TYPE fenced blocks as CardBlocks, everything else as text.
 */
function parseAIResponse(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const regex = new RegExp(CARD_FENCE_REGEX.source, 'g')

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim()
    if (before) {
      blocks.push({ type: 'text', text: before })
    }

    const cardType = match[1]!.slice(5) // strip "card:" prefix
    const jsonStr = match[2]!.trim()

    if (CARD_TYPES.includes(cardType as CardType)) {
      try {
        const data = JSON.parse(jsonStr)
        blocks.push({ type: 'card', card: cardType as CardType, data } as CardBlock)
      } catch {
        blocks.push({ type: 'text', text: `\`\`\`json\n${jsonStr}\n\`\`\`` })
      }
    } else {
      blocks.push({ type: 'text', text: `\`\`\`${cardType}\n${jsonStr}\n\`\`\`` })
    }

    lastIndex = match.index + match[0].length
  }

  const remaining = text.slice(lastIndex).trim()
  if (remaining) {
    blocks.push({ type: 'text', text: remaining })
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', text })
  }

  return blocks
}

/**
 * Streaming AI response.
 * Calls `onUpdate` with the current parsed ContentBlock[] as text arrives.
 * Text streams in real-time; cards are buffered until their closing fence.
 */
export async function streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onUpdate: (blocks: ContentBlock[]) => void,
  systemPrompt?: string,
): Promise<ContentBlock[]> {
  const apiKey = getAPIKey()
  if (!apiKey) {
    const blocks: ContentBlock[] = [{ type: 'text', text: "I'm not connected to an AI service yet. Add your Anthropic API key in settings to enable live responses." }]
    onUpdate(blocks)
    return blocks
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
      onUpdate(parseStreamingText(accumulated))
    })

    await stream.finalMessage()

    // Final parse for complete response
    const finalBlocks = parseAIResponse(accumulated)
    onUpdate(finalBlocks)
    return finalBlocks
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error calling AI service'
    const blocks: ContentBlock[] = [{ type: 'text', text: `⚠️ AI error: ${message}` }]
    onUpdate(blocks)
    return blocks
  }
}

/**
 * Incremental parser for streaming text.
 * Renders text outside card fences immediately.
 * Completed card fences get parsed as cards.
 * In-progress card fences are hidden (buffered).
 */
function parseStreamingText(raw: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const cardRegex = new RegExp(CARD_FENCE_REGEX.source, 'g')
  const partialFenceRegex = new RegExp(CARD_PARTIAL_FENCE_REGEX.source)

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = cardRegex.exec(raw)) !== null) {
    const before = raw.slice(lastIndex, match.index).trim()
    if (before) {
      blocks.push({ type: 'text', text: before })
    }

    const cardType = match[1]!.slice(5) // strip "card:" prefix
    const jsonStr = match[2]!.trim()

    if (CARD_TYPES.includes(cardType as CardType)) {
      try {
        const data = JSON.parse(jsonStr)
        blocks.push({ type: 'card', card: cardType as CardType, data } as CardBlock)
      } catch {
        blocks.push({ type: 'text', text: `\`\`\`json\n${jsonStr}\n\`\`\`` })
      }
    } else {
      blocks.push({ type: 'text', text: `\`\`\`${cardType}\n${jsonStr}\n\`\`\`` })
    }

    lastIndex = match.index + match[0].length
  }

  const remaining = raw.slice(lastIndex)

  if (partialFenceRegex.test(remaining)) {
    const fenceStart = remaining.search(/```card:/)
    const visibleText = remaining.slice(0, fenceStart).trim()
    if (visibleText) {
      blocks.push({ type: 'text', text: visibleText })
    }
  } else {
    const trimmed = remaining.trim()
    if (trimmed) {
      blocks.push({ type: 'text', text: trimmed })
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', text: '' })
  }

  return blocks
}
