'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiUpload } from 'react-icons/fi'
import { authClient } from '@/db/auth-client'
import { Header } from '@/components/generator/Header'
import { ResumeCard } from '@/components/resumes/ResumeCard'
import { CreateResumeDialog } from '@/components/resumes/CreateResumeDialog'
import { ImportResumeDialog } from '@/components/resumes/ImportResumeDialog'
import type { TagColor } from '@/lib/tagColors'

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
      router.replace('/login')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch('/api/resumes').then((res) => {
        if (!res.ok) throw new Error('Failed to load resumes')
        return res.json()
      }),
      fetch('/api/tags').then((res) => (res.ok ? res.json() : []))
    ])
      .then(([resumeData, tagsData]) => {
        setResumes(resumeData)
        const map: Record<string, TagItem> = {}
        for (const tag of tagsData) map[tag.name] = tag
        setTagMap(map)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  if (isPending || !session) return null

  return (
    <div className="min-h-screen bg-app-background text-slate-100">
      <Header
        showTags={false}
        className="relative z-10 border-b border-app-border bg-app-background/90 backdrop-blur"
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-2xl font-semibold text-white">
                My Resumes
              </h1>
              {!loading && !error && (
                <p className="mt-1 text-sm text-slate-400">
                  {resumes.length === 0
                    ? 'No resumes yet'
                    : `${resumes.length} resume${resumes.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            <CreateResumeDialog>
              <button className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-app-button border border-white/90 bg-white px-4 py-2 text-sm font-medium text-app-background transition hover:bg-zinc-200 cursor-pointer sm:hidden">
                <FiPlus size={16} />
                New Resume
              </button>
            </CreateResumeDialog>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <ImportResumeDialog>
              <button className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm font-medium text-white transition hover:bg-app-controlHover cursor-pointer">
                <FiUpload size={15} />
                Import
              </button>
            </ImportResumeDialog>
            <CreateResumeDialog>
              <button className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-app-button border border-white/90 bg-white px-4 py-2 text-sm font-medium text-app-background transition hover:bg-zinc-200 cursor-pointer sm:flex">
                <FiPlus size={16} />
                New Resume
              </button>
            </CreateResumeDialog>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-app-card border border-app-border bg-app-surface"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-app-card border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-app-card border border-dashed border-white/10 py-24 text-center">
            <p className="mb-4 text-slate-400">
              You haven&apos;t created any resumes yet.
            </p>
            <CreateResumeDialog>
              <button className="flex items-center gap-2 rounded-app-button border border-app-controlBorder bg-app-control px-5 py-2 text-sm text-white transition hover:border-app-borderStrong hover:bg-app-controlHover cursor-pointer">
                <FiPlus size={15} />
                Create your first resume
              </button>
            </CreateResumeDialog>
          </div>
        )}

        {!loading && !error && resumes.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume._id}
                id={resume._id}
                title={resume.title}
                tags={resume.tags}
                tagMap={tagMap}
                updatedAt={resume.updatedAt}
                onDelete={(id) =>
                  setResumes((prev) => prev.filter((r) => r._id !== id))
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
