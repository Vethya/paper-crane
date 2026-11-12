import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { Tag } from '@/db/models/tag'
import { Resume } from '@/db/models/resume'
import { invalidId, parseBody } from '@/lib/apiValidation'
import { UpdateTagSchema } from '@/lib/apiSchemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  const { data, error } = await parseBody(request, UpdateTagSchema)
  if (error) return error
  const { name, color } = data

  const mongoose = await connectDB()

  const tag = await Tag.findOne({ _id: id, userId: session.user.id })
  if (!tag) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const oldName = tag.name

  const dbSession = await mongoose.startSession()
  try {
    dbSession.startTransaction()

    if (name !== undefined) tag.name = name
    if (color !== undefined) tag.color = color
    await tag.save({ session: dbSession })

    // If renamed, update the string in all resumes that used the old name
    if (name !== undefined && name !== oldName) {
      await Resume.updateMany(
        { userId: session.user.id, tags: oldName },
        { $set: { 'tags.$': name } },
        { session: dbSession }
      )
    }

    await dbSession.commitTransaction()
  } catch (err) {
    await dbSession.abortTransaction()
    throw err
  } finally {
    dbSession.endSession()
  }

  return NextResponse.json(tag)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const badId = invalidId(id)
  if (badId) return badId

  const mongoose = await connectDB()

  const dbSession = await mongoose.startSession()
  let tag
  try {
    dbSession.startTransaction()

    tag = await Tag.findOneAndDelete(
      { _id: id, userId: session.user.id },
      { session: dbSession }
    )
    if (!tag) {
      await dbSession.abortTransaction()
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Remove the tag name from all resumes
    await Resume.updateMany(
      { userId: session.user.id },
      { $pull: { tags: tag.name } },
      { session: dbSession }
    )

    await dbSession.commitTransaction()
  } catch (err) {
    await dbSession.abortTransaction()
    throw err
  } finally {
    dbSession.endSession()
  }

  return new NextResponse(null, { status: 204 })
}
