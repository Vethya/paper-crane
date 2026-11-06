import { google } from '@ai-sdk/google'
import { streamText, type ModelMessage } from 'ai'
import { NextResponse, type NextRequest } from 'next/server'
import type { AgentMode } from '../../../../atoms/agentAtom'
import { auth } from '../../../../lib/auth'
import { SYSTEM_PROMPTS } from '../../../../constants/prompts.constants'
import { aiDisabledResponse } from '@/lib/aiFeatures'
import { parseBody } from '@/lib/apiValidation'
import { AgentChatSchema } from '@/lib/apiSchemas'

// Ensure the env var is validated at startup via src/env.ts
import '../../../../env'

export async function POST(request: NextRequest) {
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await parseBody(request, AgentChatSchema)
  if (error) return error
  const { messages, mode } = data

  const modelMessages: ModelMessage[] = messages.map(({ role, content }) => ({
    role,
    content
  }))

  const upstream = new AbortController()
  const result = streamText({
    abortSignal: AbortSignal.any([request.signal, upstream.signal]),
    model: google('gemini-3.1-flash-lite-preview'),
    system:
      SYSTEM_PROMPTS[mode as Exclude<AgentMode, 'Tailoring'>] ??
      SYSTEM_PROMPTS.Chat,
    messages: modelMessages
  })

  // Use fullStream to detect errors — textStream silently swallows them.
  // We buffer the first chunk to surface connection/auth errors before
  // committing to a 200 response.
  const iterator = result.fullStream[Symbol.asyncIterator]()
  const firstChunks: string[] = []

  try {
    // Read until we get actual text or the stream ends/errors
    let next = await iterator.next()
    while (!next.done) {
      const part = next.value
      if (part.type === 'error') {
        throw part.error
      }
      if (part.type === 'text-delta') {
        firstChunks.push(part.text)
        break
      }
      next = await iterator.next()
    }
  } catch (err) {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    console.error('[agent/chat] Error:', err)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 502 }
    )
  }

  // Stream remaining content with first chunks prepended
  const encoder = new TextEncoder()
  let cancelled = false
  const stream = new ReadableStream({
    cancel() {
      cancelled = true
      upstream.abort()
      void iterator.return?.().catch(() => {})
    },
    async start(controller) {
      for (const chunk of firstChunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      try {
        for await (const part of { [Symbol.asyncIterator]: () => iterator }) {
          if (cancelled) return
          if (part.type === 'text-delta') {
            controller.enqueue(encoder.encode(part.text))
          } else if (part.type === 'error') {
            console.error('[agent/chat] Stream error:', part.error)
            break
          }
        }
      } catch (err) {
        if (!cancelled && !request.signal.aborted)
          console.error('[agent/chat] Stream error:', err)
      } finally {
        if (!cancelled) controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
