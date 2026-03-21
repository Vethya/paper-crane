import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/db"
import { Resume } from "@/db/models/resume"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDB()

  const resumes = await Resume.find(
    { userId: session.user.id },
    { content: 0 }
  ).sort({ updatedAt: -1 }).lean()

  return NextResponse.json(resumes)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content } = await request.json()
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  await connectDB()

  const resume = await Resume.create({
    userId: session.user.id,
    title: title.trim(),
    templateId: "1",
    content: content ?? {
      headings: {},
      sections: ["profile", "education", "work", "skills", "projects", "awards"],
      selectedTemplate: 1,
    },
  })

  return NextResponse.json({ _id: resume._id, title: resume.title }, { status: 201 })
}
