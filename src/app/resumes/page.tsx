'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiSearch, FiUpload } from 'react-icons/fi'
import { authClient } from '@/db/auth-client'
import { Header } from '@/components/generator/Header'
import { ResumeCard } from '@/components/resumes/ResumeCard'
import { CreateResumeDialog } from '@/components/resumes/CreateResumeDialog'
import { ImportResumeDialog } from '@/components/resumes/ImportResumeDialog'
import { tagColorMap } from '@/lib/tagColors'
import { useQuery } from '@tanstack/react-query'
import { useQueryAccount } from '@/components/providers/QueryProvider'
import { resumesQuery, tagsQuery, type ResumeListItem } from '@/lib/queries'
import {
  CardSkeletons,
  LibrarySkeleton
} from '@/components/library/LibrarySkeleton'

const EMPTY_RESUMES: ResumeListItem[] = []

export default function ResumesPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const account = useQueryAccount()
  const resumeRequest = useQuery(resumesQuery(account))
  const tagRequest = useQuery(tagsQuery(account))
  const resumes = resumeRequest.data ?? EMPTY_RESUMES
  const tagMap = Object.fromEntries(
    (tagRequest.data ?? []).map((tag) => [tag.name, tag])
  )
  const loading = resumeRequest.isPending
  const error = !resumeRequest.data ? resumeRequest.error?.message : null
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const usedTags = useMemo(
    () => Array.from(new Set(resumes.flatMap((r) => r.tags ?? []))).sort(),
    [resumes]
  )
  const visibleResumes = useMemo(() => {
    const term = query.trim().toLowerCase()
    return resumes.filter(
      (r) =>
        (!term || r.title.toLowerCase().includes(term)) &&
        activeTags.every((t) => r.tags?.includes(t))
    )
  }, [resumes, query, activeTags])

  function toggleTag(tag: string) {
    setActiveTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    )
  }

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login')
    }
  }, [session, isPending, router])

  if (isPending) return <LibrarySkeleton title="My Resumes" />
  if (!session) return null

  return (
    <div className="min-h-screen bg-app-background text-slate-100">
      <Header
        showTags={false}
        className="relative z-10 border-b border-app-border bg-app-background/90 backdrop-blur"
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-2xl font-semibold tracking-tight text-white">
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
              <button className="flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-app-button bg-white px-4 text-sm font-medium text-app-background transition hover:bg-app-primaryHover sm:hidden">
                <FiPlus size={16} />
                New Resume
              </button>
            </CreateResumeDialog>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <ImportResumeDialog>
              <button className="flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-app-button border border-app-border bg-app-surface px-4 text-sm font-medium text-white transition hover:bg-app-control">
                <FiUpload size={15} />
                Import
              </button>
            </ImportResumeDialog>
            <CreateResumeDialog>
              <button className="hidden h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-app-button bg-white px-4 text-sm font-medium text-app-background transition hover:bg-app-primaryHover sm:flex">
                <FiPlus size={16} />
                New Resume
              </button>
            </CreateResumeDialog>
          </div>
        </div>

        {!loading && !error && resumes.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="relative w-full sm:w-72">
              <FiSearch
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resumes"
                aria-label="Search resumes"
                className="h-9 w-full rounded-app-button border border-app-border bg-app-surface pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-app-borderStrong focus:outline-none"
              />
            </label>
            {usedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {usedTags.map((tag) => {
                  const active = activeTags.includes(tag)
                  const color = tagColorMap[tagMap[tag]?.color ?? 'gray']
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(tag)}
                      className={`flex h-8 items-center gap-1.5 rounded-app-button px-2.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-app-control text-white'
                          : 'text-slate-400 hover:bg-app-hover hover:text-white'
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      />
                      {tag}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tagRequest.isError && (
          <p role="status" className="mb-4 text-sm text-slate-400">
            Unable to refresh tags.{' '}
            <button
              className="underline"
              onClick={() => void tagRequest.refetch()}
            >
              Retry
            </button>
          </p>
        )}
        {resumeRequest.isError && resumeRequest.data && (
          <p role="status" className="mb-4 text-sm text-slate-400">
            Unable to refresh resumes.{' '}
            <button
              className="underline"
              onClick={() => void resumeRequest.refetch()}
            >
              Retry
            </button>
          </p>
        )}
        {loading && <CardSkeletons label="Loading resumes" />}

        {error && (
          <div className="rounded-app-card border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void resumeRequest.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-app-card border border-dashed border-app-controlBorder py-24 text-center">
            <p className="mb-4 text-slate-400">
              You haven&apos;t created any resumes yet.
            </p>
            <CreateResumeDialog>
              <button className="flex h-9 cursor-pointer items-center gap-2 rounded-app-button bg-white px-4 text-sm font-medium text-app-background transition hover:bg-app-primaryHover">
                <FiPlus size={15} />
                Create your first resume
              </button>
            </CreateResumeDialog>
          </div>
        )}

        {!loading &&
          !error &&
          resumes.length > 0 &&
          visibleResumes.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <p className="text-sm text-slate-400">
                No resumes match your search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setActiveTags([])
                }}
                className="h-8 rounded-app-button bg-app-control px-3 text-sm font-medium text-white transition hover:bg-app-controlHover"
              >
                Clear filters
              </button>
            </div>
          )}

        {!loading && !error && visibleResumes.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleResumes.map((resume) => (
              <ResumeCard
                key={resume._id}
                id={resume._id}
                title={resume.title}
                tags={resume.tags}
                tagMap={tagMap}
                updatedAt={resume.updatedAt}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
