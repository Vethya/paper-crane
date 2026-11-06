import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { Resume } from '@/db/models/resume'
import { invalidId, parseBody } from '@/lib/apiValidation'
import { UpdateResumeSchema } from '@/lib/apiSchemas'
import { newerWriteFilter, parseWriter } from '@/lib/contentWriter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  await connectDB()

  const resume = await Resume.findOne({
    _id: id,
    userId: session.user.id
  }).lean()
  if (!resume) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(resume)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  const { data: body, error } = await parseBody(request, UpdateResumeSchema)
  if (error) return error

  await connectDB()

  const writer = body.content ? parseWriter(body.writer) : null
  const resume = await Resume.findOneAndUpdate(
    {
      _id: id,
      userId: session.user.id,
      ...(writer && newerWriteFilter(writer))
    },
    {
      $set: {
        ...(body.content && { content: body.content }),
        ...(writer && { contentWriter: writer }),
        ...(body.title && { title: body.title }),
        ...(body.tags && { tags: body.tags })
      }
    },
    { new: true, select: { content: 0 } }
  ).lean()

  if (!resume) {
    // A newer save from the same page already landed, so ignore this one.
    if (writer && (await Resume.exists({ _id: id, userId: session.user.id })))
      return NextResponse.json({ stale: true })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(resume)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  await connectDB()

  const resume = await Resume.findOneAndDelete({
    _id: id,
    userId: session.user.id
  })
  if (!resume) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
