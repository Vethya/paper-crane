import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/db"
import { Resume } from "@/db/models/resume"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await connectDB()

  const resume = await Resume.findOne({ _id: id, userId: session.user.id }).lean()
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(resume)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const title = typeof body.title === "string" ? body.title.trim() : undefined

  if (typeof body.title === "string" && !title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  await connectDB()

  const resume = await Resume.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { ...(body.content && { content: body.content }), ...(title && { title }), ...(Array.isArray(body.tags) && { tags: body.tags }) } },
    { new: true, select: { content: 0 } }
  ).lean()

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(resume)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await connectDB()

  const resume = await Resume.findOneAndDelete({ _id: id, userId: session.user.id })
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
