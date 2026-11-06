import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { AgentSession } from '@/db/models/agentSession'
import { Resume } from '@/db/models/resume'
import { aiDisabledResponse } from '@/lib/aiFeatures'
import { invalidId, parseBody } from '@/lib/apiValidation'
import { SaveAgentSessionSchema } from '@/lib/apiSchemas'

export async function GET(request: NextRequest) {
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resumeId = request.nextUrl.searchParams.get('resumeId')
  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })
  }
  const badId = invalidId(resumeId)
  if (badId) return badId

  await connectDB()

  const resume = await Resume.findOne({
    _id: resumeId,
    userId: session.user.id
  }).lean()
  if (!resume) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await parseBody(request, SaveAgentSessionSchema)
  if (error) return error
  const { resumeId, sessionId, mode, messages } = data

  await connectDB()

  const resume = await Resume.findOne({
    _id: resumeId,
    userId: session.user.id
  }).lean()
  if (!resume) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const visibleMessages = messages.map(({ id, role, content }) => ({
    id,
    role,
    content
  }))

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
    messages: visibleMessages
  })

  return NextResponse.json({ sessionId: String(created._id) }, { status: 201 })
}
