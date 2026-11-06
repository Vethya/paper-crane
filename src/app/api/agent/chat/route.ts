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

  const { data, error } = await parseBody(request, AgentChatSchema, 768_000)
  if (error) return error
  const { messages, mode, resumeData } = data

  const modelMessages: ModelMessage[] = messages.map(({ role, content }) => ({
    role,
    content
  }))

  const result = streamText({
    model: google('gemini-3.1-flash-lite-preview'),
    system:
      SYSTEM_PROMPTS[mode as Exclude<AgentMode, 'Tailoring'>] ??
      SYSTEM_PROMPTS.Chat,
    maxOutputTokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Current resume: ${JSON.stringify(resumeData)}`
      },
      { role: 'assistant', content: 'I will use this resume as context.' },
      ...modelMessages
    ]
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
      if (part.type === 'finish' && part.finishReason === 'length')
        firstChunks.push(
          'Reply reached its length limit. Ask a narrower question for more detail.'
        )
      if (part.type === 'text-delta') {
        firstChunks.push(part.text)
        break
      }
      next = await iterator.next()
    }
  } catch (err) {
    console.error('[agent/chat] Error:', err)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 502 }
    )
  }

  // Stream remaining content with first chunks prepended
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of firstChunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      try {
        for await (const part of { [Symbol.asyncIterator]: () => iterator }) {
          if (part.type === 'text-delta') {
            controller.enqueue(encoder.encode(part.text))
          } else if (part.type === 'finish' && part.finishReason === 'length') {
            controller.enqueue(
              encoder.encode(
                '\n\nReply reached its length limit. Ask a narrower question for more detail.'
              )
            )
          } else if (part.type === 'error') {
            console.error('[agent/chat] Stream error:', part.error)
            break
          }
        }
      } catch (err) {
        console.error('[agent/chat] Stream error:', err)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
