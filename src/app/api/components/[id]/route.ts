import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { ResumeComponent } from '@/db/models/resumeComponent'
import {
  getComponentFingerprint,
  isComponentType,
  validateComponentContent
} from '@/lib/resumeComponents'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { type, content } = await request.json()

  await connectDB()

  const component = await ResumeComponent.findOne({
    _id: id,
    userId: session.user.id
  })

  if (!component) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    type !== undefined &&
    (!isComponentType(type) || type !== component.type)
  ) {
    return NextResponse.json(
      { error: 'Component type cannot be changed' },
      { status: 400 }
    )
  }

  const validationError = validateComponentContent(component.type, content)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const fingerprint = getComponentFingerprint(component.type, content)
  const duplicate = await ResumeComponent.findOne({
    _id: { $ne: id },
    userId: session.user.id,
    fingerprint
  }).lean()

  if (duplicate) {
    return NextResponse.json(
      { error: 'Duplicate component', duplicateId: duplicate._id },
      { status: 409 }
    )
  }

  component.content = content
  component.fingerprint = fingerprint
  await component.save()

  return NextResponse.json(component)
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
  await connectDB()

  const component = await ResumeComponent.findOneAndDelete({
    _id: id,
    userId: session.user.id
  })

  if (!component) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
