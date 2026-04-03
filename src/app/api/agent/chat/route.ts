import { google } from '@ai-sdk/google'
import { streamText, type ModelMessage } from 'ai'
import { NextResponse, type NextRequest } from 'next/server'
import type { AgentMessage, AgentMode } from '../../../../atoms/agentAtom'
import { auth } from '../../../../lib/auth'
import { SYSTEM_PROMPTS } from '../../../../constants/prompts.constants'

// Ensure the env var is validated at startup via src/env.ts
import '../../../../env'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, mode } = (await request.json()) as {
    messages: AgentMessage[]
    mode: AgentMode
  }

  const modelMessages: ModelMessage[] = messages.map(({ role, content }) => ({
    role,
    content,
  }))

  const result = streamText({
    model: google('gemini-3.1-flash-lite-preview'),
    system: SYSTEM_PROMPTS[mode as Exclude<AgentMode, 'Tailoring'>] ?? SYSTEM_PROMPTS.Chat,
    messages: modelMessages,
  })

  return result.toTextStreamResponse()
}
