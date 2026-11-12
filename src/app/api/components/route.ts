import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { ResumeComponent } from '@/db/models/resumeComponent'
import {
  getComponentFingerprint,
  isComponentType,
  validateComponentContent
} from '@/lib/resumeComponents'
import { parseBody } from '@/lib/apiValidation'
import { ComponentBodySchema } from '@/lib/apiSchemas'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const requestedType = request.nextUrl.searchParams.get('type')
  if (requestedType && !isComponentType(requestedType)) {
    return NextResponse.json(
      { error: 'Invalid component type' },
      { status: 400 }
    )
  }

  const components = await ResumeComponent.find({
    userId: session.user.id,
    ...(requestedType && { type: requestedType })
  })
    .sort({ updatedAt: -1 })
    .lean()

  return NextResponse.json(components)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await parseBody(request, ComponentBodySchema)
  if (error) return error
  const { type, content } = data
  if (!isComponentType(type)) {
    return NextResponse.json(
      { error: 'Invalid component type' },
      { status: 400 }
    )
  }

  const validationError = validateComponentContent(type, content)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  await connectDB()

  const fingerprint = getComponentFingerprint(type, content)
  const duplicate = await ResumeComponent.findOne({
    userId: session.user.id,
    fingerprint
  }).lean()

  if (duplicate) {
    return NextResponse.json(
      { error: 'Duplicate component', duplicateId: duplicate._id },
      { status: 409 }
    )
  }

  const component = await ResumeComponent.create({
    userId: session.user.id,
    type,
    content,
    fingerprint
  })

  return NextResponse.json(component, { status: 201 })
}
