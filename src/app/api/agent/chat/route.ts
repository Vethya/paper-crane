import { google } from '@ai-sdk/google'
import { streamText, type ModelMessage } from 'ai'
import { NextResponse, type NextRequest } from 'next/server'
import type { AgentMessage, AgentMode } from '../../../../atoms/agentAtom'
import { auth } from '../../../../lib/auth'

// Ensure the env var is validated at startup via src/env.ts
import '../../../../env'

const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  Chat: `You are a resume assistant. Help the user with questions about their resume, offer phrasing suggestions, career advice, and content improvements. Communicate only through messages — do not directly edit the resume. Be concise and helpful.`,

  Feedback: `You are a resume reviewer. Analyze the user's resume and deliver structured, actionable feedback. Focus on clarity, impact, completeness, ATS compatibility, and professional presentation. Organize your feedback clearly. You do not edit the resume — only provide feedback through conversation.`,

  Tailoring: `You are a resume tailoring agent. Help the user adapt their resume for specific roles or job descriptions. Communicate only through messages for now.`,
}

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
    system: SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.Chat,
    messages: modelMessages,
  })

  return result.toTextStreamResponse()
}
