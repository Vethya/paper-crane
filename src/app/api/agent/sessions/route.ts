import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { AgentSession } from '@/db/models/agentSession'
import type { AgentMode, AgentMessage } from '@/atoms/agentAtom'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resumeId = request.nextUrl.searchParams.get('resumeId')
  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })
  }

  await connectDB()

  const sessions = await AgentSession.find(
    { resumeId, userId: session.user.id },
    { messages: { $slice: 1 } }
  )
    .sort({ updatedAt: -1 })
    .lean()

  return NextResponse.json(
    sessions.map((s) => {
      const { messages, ...rest } = s
      return { ...rest, preview: messages[0]?.content?.slice(0, 120) ?? '' }
    })
  )
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { resumeId, sessionId, mode, messages } = (await request.json()) as {
    resumeId: string
    sessionId: string | null
    mode: AgentMode
    messages: AgentMessage[]
  }

  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })
  }

  await connectDB()

  const visibleMessages = messages.map(({ id, role, content }) => ({ id, role, content }))

  if (sessionId) {
    await AgentSession.updateOne(
      { _id: sessionId, userId: session.user.id },
      { $set: { mode, messages: visibleMessages } }
    )
    return NextResponse.json({ sessionId })
  }

  const created = await AgentSession.create({
    resumeId,
    userId: session.user.id,
    mode,
    messages: visibleMessages,
  })

  return NextResponse.json({ sessionId: String(created._id) }, { status: 201 })
}
