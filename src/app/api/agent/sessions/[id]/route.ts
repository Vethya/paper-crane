import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { AgentSession } from '@/db/models/agentSession'
import { aiDisabledResponse } from '@/lib/aiFeatures'
import { invalidId } from '@/lib/apiValidation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  await connectDB()

  const agentSession = await AgentSession.findOne({
    _id: id,
    userId: session.user.id
  }).lean()

  if (!agentSession) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(agentSession)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  await connectDB()

  await AgentSession.deleteOne({ _id: id, userId: session.user.id })

  return new NextResponse(null, { status: 204 })
}
