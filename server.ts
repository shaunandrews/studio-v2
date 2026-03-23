import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const app = express()
app.use(express.json())

// --- API routes ---

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
    return
  }

  const { messages, system, tools, max_tokens } = req.body ?? {}
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array required' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const stream = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens ?? 16000,
      system: system ?? '',
      messages,
      ...(tools?.length ? { tools } : {}),
      stream: true,
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let stopReason = 'end_turn'

    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_start':
          if (event.content_block.type === 'tool_use') {
            res.write(`data: ${JSON.stringify({
              type: 'tool_use_start',
              id: event.content_block.id,
              name: event.content_block.name,
            })}\n\n`)
          }
          break

        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
          } else if (event.delta.type === 'input_json_delta') {
            res.write(`data: ${JSON.stringify({
              type: 'tool_use_delta',
              partial_json: event.delta.partial_json,
            })}\n\n`)
          }
          break

        case 'content_block_stop':
          res.write(`data: ${JSON.stringify({ type: 'content_block_stop' })}\n\n`)
          break

        case 'message_delta':
          if (event.delta.stop_reason) {
            stopReason = event.delta.stop_reason
          }
          break
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done', stop_reason: stopReason })}\n\n`)
    res.end()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (!res.headersSent) {
      res.status(500).json({ error: message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
      res.end()
    }
  }
})

app.post('/api/title', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
    return
  }

  const { prompt } = req.body ?? {}
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt string required' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
    res.json({ title: text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// --- App serving (only when run directly, not imported) ---

const isDirectRun = process.argv[1]?.includes('server')

if (isDirectRun) {
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')))
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
    })
  } else {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  const port = process.env.PORT ?? 3025
  app.listen(port, () => {
    console.log(`http://localhost:${port}`)
  })
}
