'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryAccount } from '@/components/providers/QueryProvider'
import { componentsQuery, queryKeys } from '@/lib/queries'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CardSkeletons,
  LibrarySkeleton
} from '@/components/library/LibrarySkeleton'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { toast } from '@/components/ui/sonner'
import { authClient } from '@/db/auth-client'
import { Header } from '@/components/generator/Header'
import { ComponentCard } from '@/components/resume-components/ComponentCard'
import { ComponentDetailsDialog } from '@/components/resume-components/ComponentDetailsDialog'
import { ComponentEditorDialog } from '@/components/resume-components/ComponentEditorDialog'
import {
  componentMatchesSearch,
  componentMeta,
  componentTypes,
  isComponentType,
  type ResumeComponent,
  type ResumeComponentContent,
  type ResumeComponentType
} from '@/lib/resumeComponents'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const EMPTY_COMPONENTS: ResumeComponent[] = []

const DEFAULT_TYPE: ResumeComponentType = 'work'

export default function ComponentsPage() {
  return (
    <Suspense fallback={<LibrarySkeleton title="Components" />}>
      <ComponentsContent />
    </Suspense>
  )
}

function ComponentsContent() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlType = searchParams.get('type')
  const activeType = isComponentType(urlType) ? urlType : DEFAULT_TYPE
  const client = useQueryClient()
  const account = useQueryAccount()
  const request = useQuery(componentsQuery(account))
  const components = request.data ?? EMPTY_COMPONENTS
  const loading = request.isPending
  const error =
    request.isError && !request.data ? 'Unable to load components.' : null
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ResumeComponent | null>(null)
  const [details, setDetails] = useState<ResumeComponent | null>(null)
  const [deleting, setDeleting] = useState<ResumeComponent | null>(null)

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (searchParams.get('type') === activeType) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', activeType)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [activeType, pathname, router, searchParams])

  async function refreshComponents() {
    await client.cancelQueries({ queryKey: queryKeys.components(account) })
    await client.invalidateQueries({ queryKey: queryKeys.components(account) })
  }

  const counts = useMemo(() => {
    return Object.fromEntries(
      componentTypes.map((type) => [
        type,
        components.filter((component) => component.type === type).length
      ])
    ) as Record<ResumeComponentType, number>
  }, [components])

  const activeComponents = components
    .filter((component) => component.type === activeType)
    .filter((component) => componentMatchesSearch(component, query))

  const hasAnyComponents = components.length > 0

  function changeType(type: ResumeComponentType) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', type)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  async function saveComponent(content: ResumeComponentContent) {
    const res = await fetch(
      editing ? `/api/components/${editing._id}` : '/api/components',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: editing?.type ?? activeType, content })
      }
    )
    const data = res.status === 204 ? null : await res.json().catch(() => null)

    if (res.status === 409) {
      toast.error('That component is already saved.')
      throw new Error('Duplicate component')
    }

    if (!res.ok) {
      toast.error(data?.error ?? 'Unable to save component.')
      throw new Error(data?.error ?? 'Unable to save component')
    }

    await refreshComponents()
    toast.success(editing ? 'Component updated.' : 'Component created.')
    setEditing(null)
  }

  async function deleteComponent() {
    if (!deleting) return
    const res = await fetch(`/api/components/${deleting._id}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      toast.error('Unable to delete component.')
      return
    }
    await client.cancelQueries({ queryKey: queryKeys.components(account) })
    client.setQueryData<ResumeComponent[]>(
      queryKeys.components(account),
      (items) => items?.filter((item) => item._id !== deleting._id)
    )
    setDetails((current) => (current?._id === deleting._id ? null : current))
    setDeleting(null)
    toast.success('Component deleted.')
  }

  if (isPending) return <LibrarySkeleton title="Components" />
  if (!session) return null

  return (
    <div className="min-h-screen bg-app-background text-slate-100">
      <Header
        showTags={false}
        className="relative z-10 border-b border-app-border bg-app-background/90 backdrop-blur"
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Components</h1>
            <p className="mt-1 text-sm text-slate-400">
              Reusable resume entries you can copy into saved resumes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-app-button border border-white/90 bg-white px-4 py-2 text-sm font-medium text-app-background transition hover:bg-app-primaryHover"
          >
            <FiPlus size={16} />
            {componentMeta[activeType].newLabel}
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {componentTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => changeType(type)}
                className={`shrink-0 rounded-app-button px-4 py-2 text-sm font-medium transition ${
                  activeType === type
                    ? 'bg-white text-app-background'
                    : 'border border-app-controlBorder bg-app-control text-slate-300 hover:bg-app-controlHover hover:text-white'
                }`}
              >
                {componentMeta[type].pluralLabel}
                <span className="ml-2 text-xs opacity-70">
                  {loading ? (
                    <Skeleton inline className="inline-block h-3 w-4" />
                  ) : (
                    request.data && counts[type]
                  )}
                </span>
              </button>
            ))}
          </div>

          <label className="relative block md:w-72">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search components"
              className="h-10 w-full rounded-app-button border border-app-controlBorder bg-app-control py-2 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-app-borderStrong"
            />
          </label>
        </div>

        {request.isError && request.data && (
          <p role="status" className="mb-4 text-sm text-slate-400">
            Unable to refresh components.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void request.refetch()}
            >
              Retry
            </button>
          </p>
        )}
        {loading && <CardSkeletons label="Loading components" count={6} />}

        {error && (
          <div
            role="alert"
            className="rounded-app-card border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400"
          >
            {error}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void request.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !hasAnyComponents && (
          <div className="flex flex-col items-center justify-center rounded-app-card border border-dashed border-white/10 py-24 text-center">
            <p className="mb-4 text-slate-400">
              You haven&apos;t saved any reusable components yet.
            </p>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="inline-flex items-center gap-2 rounded-app-button border border-app-controlBorder bg-app-control px-5 py-2 text-sm text-white transition hover:border-app-borderStrong hover:bg-app-controlHover"
            >
              <FiPlus size={15} />
              {componentMeta[activeType].newLabel}
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          hasAnyComponents &&
          activeComponents.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-app-card border border-dashed border-white/10 py-20 text-center">
              <p className="mb-4 text-slate-400">
                No {componentMeta[activeType].pluralLabel.toLowerCase()} match
                this view.
              </p>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="inline-flex items-center gap-2 rounded-app-button border border-app-controlBorder bg-app-control px-5 py-2 text-sm text-white transition hover:border-app-borderStrong hover:bg-app-controlHover"
              >
                <FiPlus size={15} />
                {componentMeta[activeType].newLabel}
              </button>
            </div>
          )}

        {!loading && !error && activeComponents.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeComponents.map((component) => (
              <ComponentCard
                key={component._id}
                component={component}
                mode="library"
                onOpen={setDetails}
                onEdit={(item) => {
                  setEditing(item)
                  setEditorOpen(true)
                }}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </main>

      <ComponentEditorDialog
        open={editorOpen}
        type={editing?.type ?? activeType}
        component={editing}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) setEditing(null)
        }}
        onSave={saveComponent}
      />

      <ComponentDetailsDialog
        component={details}
        mode="library"
        onOpenChange={(open) => !open && setDetails(null)}
        onEdit={(item) => {
          setDetails(null)
          setEditing(item)
          setEditorOpen(true)
        }}
        onDelete={(item) => setDeleting(item)}
      />

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-sm border border-app-border bg-app-surface text-slate-100"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              Delete this component?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Existing resumes won&apos;t be changed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm text-white transition hover:bg-app-controlHover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteComponent}
              className="rounded-app-button bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
