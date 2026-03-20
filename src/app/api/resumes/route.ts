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
