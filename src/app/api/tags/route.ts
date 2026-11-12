import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { Tag } from '@/db/models/tag'
import { parseBody } from '@/lib/apiValidation'
import { CreateTagSchema } from '@/lib/apiSchemas'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const tags = await Tag.find({ userId: session.user.id }).lean()
  return NextResponse.json(tags)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(request, CreateTagSchema)
  if (error) return error

  await connectDB()
  const tag = await Tag.create({
    userId: session.user.id,
    name: data.name,
    color: data.color
  })
  return NextResponse.json(tag, { status: 201 })
}
