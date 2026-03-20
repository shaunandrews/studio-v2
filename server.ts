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

  const { messages, system, model } = req.body ?? {}
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array required' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const stream = client.messages.stream({
      model: model ?? 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: system ?? '',
      messages,
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
    })

    stream.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
      res.end()
    })

    await stream.finalMessage()
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
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
