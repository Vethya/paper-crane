import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/db'
import { Tag } from '@/db/models/tag'

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

  const { name, color } = await request.json()
  if (!name?.trim())
    return NextResponse.json({ error: 'Name required' }, { status: 400 })

  await connectDB()
  const tag = await Tag.create({
    userId: session.user.id,
    name: name.trim(),
    color: color ?? 'gray'
  })
  return NextResponse.json(tag, { status: 201 })
}
