import { google } from '@ai-sdk/google'
import { streamText, type ModelMessage } from 'ai'
import { after, NextResponse, type NextRequest } from 'next/server'
import type { AgentMode } from '../../../../atoms/agentAtom'
import { auth } from '../../../../lib/auth'
import { SYSTEM_PROMPTS } from '../../../../constants/prompts.constants'
import { aiDisabledResponse } from '@/lib/aiFeatures'
import { parseBody } from '@/lib/apiValidation'
import { AgentChatSchema } from '@/lib/apiSchemas'
import { failedReplyMessage } from '@/lib/agentLimits'
import { finishReply, startReply } from '@/lib/agentReplies'

// Ensure the env var is validated at startup via src/env.ts
import '../../../../env'

// Leaves time to finish and save a reply after the browser disconnects.
export const maxDuration = 60

const lengthNotice =
  'Reply reached its length limit. Ask a narrower question for more detail.'

export async function POST(request: NextRequest) {
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await parseBody(request, AgentChatSchema, 768_000)
  if (error) return error
  const { messages, mode, resumeData, sessionId, replyId } = data
  const target =
    sessionId && replyId
      ? { userId: session.user.id, sessionId, replyId }
      : null
  if (target && !(await startReply(target)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const modelMessages: ModelMessage[] = messages.map(({ role, content }) => ({
    role,
    content
  }))

  // No abort signal: generation continues if the browser disconnects.
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
        firstChunks.push(lengthNotice)
      if (part.type === 'text-delta') {
        firstChunks.push(part.text)
        break
      }
      next = await iterator.next()
    }
  } catch (err) {
    console.error('[agent/chat] Error:', err)
    if (target) await finishReply(target, failedReplyMessage, true)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 502 }
    )
  }

  // Stream to the browser while it stays connected, and save the full reply.
  const encoder = new TextEncoder()
  let client: ReadableStreamDefaultController<Uint8Array> | null = null
  const send = (chunk: string) => {
    try {
      client?.enqueue(encoder.encode(chunk))
    } catch {
      client = null
    }
  }
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      client = controller
      firstChunks.forEach(send)
    },
    cancel() {
      client = null
    }
  })
  let reply = firstChunks.join('')
  const generate = async () => {
    try {
      for await (const part of { [Symbol.asyncIterator]: () => iterator }) {
        let chunk = ''
        if (part.type === 'text-delta') chunk = part.text
        else if (part.type === 'finish' && part.finishReason === 'length')
          chunk = `\n\n${lengthNotice}`
        else if (part.type === 'error') {
          console.error('[agent/chat] Stream error:', part.error)
          break
        }
        reply += chunk
        send(chunk)
      }
    } catch (err) {
      console.error('[agent/chat] Stream error:', err)
    }
    // Save before closing, so a follow-up message always sees this reply.
    if (target) await finishReply(target, reply || failedReplyMessage, !reply)
    try {
      client?.close()
    } catch {}
  }
  after(generate())

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
