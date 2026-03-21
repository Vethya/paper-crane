"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FiPlus } from "react-icons/fi"
import { authClient } from "@/db/auth-client"
import { Logo } from "@/components/core/Logo"
import { ResumeCard } from "@/components/resumes/ResumeCard"
import { CreateResumeDialog } from "@/components/resumes/CreateResumeDialog"
import type { TagColor } from "@/lib/tagColors"

interface ResumeListItem {
  _id: string
  title: string
  tags?: string[]
  updatedAt: string
}

interface TagItem {
  _id: string
  name: string
  color: TagColor
}

export default function ResumesPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [tagMap, setTagMap] = useState<Record<string, TagItem>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch("/api/resumes").then(res => {
        if (!res.ok) throw new Error("Failed to load resumes")
        return res.json()
      }),
      fetch("/api/tags").then(res => res.ok ? res.json() : []),
    ])
      .then(([resumeData, tagsData]) => {
        setResumes(resumeData)
        const map: Record<string, TagItem> = {}
        for (const tag of tagsData) map[tag.name] = tag
        setTagMap(map)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  if (isPending || !session) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-y-0 left-0 w-[25%] bg-gradient-to-r from-blue-600/10 via-blue-600/5 to-transparent blur-[140px]" />
      </div>

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{session.user.name ?? session.user.email}</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">My Resumes</h1>
            {!loading && !error && (
              <p className="mt-1 text-sm text-slate-400">
                {resumes.length === 0 ? "No resumes yet" : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>

          <CreateResumeDialog>
            <span className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 cursor-pointer">
              <FiPlus size={16} />
              New Resume
            </span>
          </CreateResumeDialog>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-white/5 bg-slate-900/50"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
            <p className="mb-4 text-slate-400">You haven&apos;t created any resumes yet.</p>
            <CreateResumeDialog>
              <span className="flex items-center gap-2 rounded-full border border-blue-500/70 px-5 py-2 text-sm text-white transition hover:border-blue-400/80 hover:text-blue-300 cursor-pointer">
                <FiPlus size={15} />
                Create your first resume
              </span>
            </CreateResumeDialog>
          </div>
        )}

        {!loading && !error && resumes.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map(resume => (
              <ResumeCard
                key={resume._id}
                id={resume._id}
                title={resume.title}
                tags={resume.tags}
                tagMap={tagMap}
                updatedAt={resume.updatedAt}
                onDelete={id => setResumes(prev => prev.filter(r => r._id !== id))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
