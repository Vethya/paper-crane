'use client'

import Link from 'next/link'
import { DragEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { ExternalLink, Plus, Search, X } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { ComponentCard } from '@/components/resume-components/ComponentCard'
import { ComponentDetailsDialog } from '@/components/resume-components/ComponentDetailsDialog'
import { ComponentEditorDialog } from '@/components/resume-components/ComponentEditorDialog'
import { componentInsertFocusAtom } from '@/atoms/resumeComponents'
import { activeSectionSetterAtom } from '@/atoms/activeSection'
import { formDataAtom, formSetValueAtom } from '@/atoms/formData'
import {
  componentMatchesSearch,
  componentMeta,
  componentTypes,
  getRequiredValue,
  isComponentType,
  type ResumeComponent,
  type ResumeComponentContent,
  type ResumeComponentType
} from '@/lib/resumeComponents'

interface ComponentsPanelProps {
  activeType: ResumeComponentType
  onActiveTypeChange: (type: ResumeComponentType) => void
  onClose: () => void
  variant?: 'panel' | 'sheet'
}

export function ComponentsPanel({
  activeType,
  onActiveTypeChange,
  onClose,
  variant = 'panel'
}: ComponentsPanelProps) {
  const [componentsByType, setComponentsByType] = useState<
    Partial<Record<ResumeComponentType, ResumeComponent[]>>
  >({})
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [details, setDetails] = useState<ResumeComponent | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const formData = useAtomValue(formDataAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const setFocusRequest = useSetAtom(componentInsertFocusAtom)
  const changeFormSection = useAtomValue(activeSectionSetterAtom)

  const loadComponents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/components')
      if (!res.ok) throw new Error('Failed to load components')
      const nextComponents = (await res.json()) as ResumeComponent[]
      setComponentsByType(
        componentTypes.reduce(
          (acc, type) => {
            acc[type] = nextComponents.filter(
              (component) => component.type === type
            )
            return acc
          },
          {} as Record<ResumeComponentType, ResumeComponent[]>
        )
      )
    } catch {
      toast.error('Unable to load components.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComponents()
  }, [loadComponents])

  useEffect(() => {
    if (!highlightedId) return
    const timeout = window.setTimeout(() => setHighlightedId(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [highlightedId])

  const counts = useMemo(() => {
    return Object.fromEntries(
      componentTypes.map((type) => [type, componentsByType[type]?.length ?? 0])
    ) as Record<ResumeComponentType, number>
  }, [componentsByType])

  const activeComponents = (componentsByType[activeType] ?? []).filter(
    (component) => componentMatchesSearch(component, query)
  )

  function addToResume(component: ResumeComponent) {
    if (!formSetValue) return
    const current = formData?.[component.type] ?? []
    const next = [...current, structuredClone(component.content)] as never
    const index = current.length
    formSetValue(component.type, next, {
      shouldDirty: true,
      shouldValidate: true
    })
    changeFormSection?.(component.type)
    setFocusRequest({ type: component.type, index, nonce: Date.now() })
    toast.success('Component added to resume.')
  }

  async function saveComponent(content: ResumeComponentContent) {
    const res = await fetch('/api/components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeType, content })
    })
    const data = await res.json().catch(() => null)

    if (res.status === 409) {
      setHighlightedId(data?.duplicateId)
      toast.error('That component is already saved.')
      throw new Error('Duplicate component')
    }
    if (!res.ok) {
      toast.error(data?.error ?? 'Unable to save component.')
      throw new Error(data?.error ?? 'Unable to save component')
    }

    await loadComponents()
    setHighlightedId(data?._id)
    toast.success('Component created.')
  }

  async function saveDroppedFormItem(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDropActive(false)
    const raw = event.dataTransfer.getData('application/x-resume-form-item')
    if (!raw) return

    let data: {
      type: ResumeComponentType
      content: ResumeComponentContent
    }
    try {
      const parsed = JSON.parse(raw) as {
        type?: unknown
        content?: unknown
      }
      if (!isComponentType(parsed.type)) return
      data = {
        type: parsed.type,
        content: parsed.content as ResumeComponentContent
      }
    } catch {
      toast.error('Unable to read dropped item.')
      return
    }

    if (!getRequiredValue(data.type, data.content as Record<string, unknown>)) {
      toast.error(
        `${componentMeta[data.type].label} needs ${componentMeta[data.type].requiredFieldLabel} before saving.`
      )
      return
    }

    const res = await fetch('/api/components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: data.type, content: data.content })
    })
    const body = await res.json().catch(() => null)

    if (res.status === 409) {
      setHighlightedId(body?.duplicateId)
      onActiveTypeChange(data.type)
      await loadComponents()
      toast.error('That component is already saved.')
      return
    }
    if (!res.ok) {
      toast.error(body?.error ?? 'Unable to save component.')
      return
    }

    await loadComponents()
    setHighlightedId(body?._id)
    onActiveTypeChange(data.type)
    toast.success('Form item saved as component.')
  }

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
        <div>
          <h2 className="text-md font-medium text-white">Components</h2>
          <p className="text-xs text-slate-400">
            Add saved pieces to this resume.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close components panel"
          className="flex h-8 w-8 items-center justify-center rounded-app-button border border-app-controlBorder bg-app-control text-slate-300 transition hover:bg-app-controlHover hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="shrink-0 space-y-4 border-b border-app-border p-5">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {componentTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onActiveTypeChange(type)}
              className={`shrink-0 rounded-app-button px-3 py-2 text-xs font-medium transition ${
                activeType === type
                  ? 'bg-white text-app-background'
                  : 'border border-app-controlBorder bg-app-control text-slate-300 hover:bg-app-controlHover hover:text-white'
              }`}
            >
              {componentMeta[type].pluralLabel}
              <span className="ml-1.5 opacity-70">{counts[type]}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-app-button border border-app-controlBorder bg-app-control py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-app-borderStrong"
            />
          </label>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-app-button border border-white bg-white px-3 text-xs font-medium text-app-background transition hover:bg-app-primaryHover"
          >
            <Plus className="h-3.5 w-3.5" />
            {componentMeta[activeType].newLabel.replace('New ', '')}
          </button>
        </div>

        {variant === 'panel' && (
          <div
            onDrop={saveDroppedFormItem}
            onDragLeave={() => setDropActive(false)}
            onDragOver={(event) => {
              if (
                event.dataTransfer.types.includes(
                  'application/x-resume-form-item'
                )
              ) {
                event.preventDefault()
                setDropActive((active) => (active ? active : true))
              }
            }}
            className={`rounded-app-card border border-dashed px-4 py-4 text-center text-sm transition ${
              dropActive
                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                : 'border-app-controlBorder bg-app-control/45 text-slate-400'
            }`}
          >
            Drop here to save as component
          </div>
        )}

        <Link
          href={`/components?type=${activeType}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 transition hover:text-white"
        >
          Open full Components Library
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-app-button border border-app-border bg-app-surface"
              />
            ))}
          </div>
        )}

        {!loading && activeComponents.length === 0 && (
          <div className="rounded-app-button border border-dashed border-app-controlBorder px-5 py-10 text-center">
            <p className="mb-4 text-sm text-slate-400">
              No {componentMeta[activeType].pluralLabel.toLowerCase()} saved
              yet.
            </p>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm text-white transition hover:bg-app-controlHover"
            >
              {componentMeta[activeType].newLabel}
            </button>
          </div>
        )}

        {!loading && activeComponents.length > 0 && (
          <div className="space-y-3">
            {activeComponents.map((component) => (
              <ComponentCard
                key={component._id}
                component={component}
                highlighted={highlightedId === component._id}
                mode="panel"
                draggable={variant === 'panel'}
                onOpen={setDetails}
                onAdd={addToResume}
                onDragStart={(item) => changeFormSection?.(item.type)}
              />
            ))}
          </div>
        )}
      </div>

      <ComponentEditorDialog
        open={editorOpen}
        type={activeType}
        onOpenChange={setEditorOpen}
        onSave={saveComponent}
      />
      <ComponentDetailsDialog
        component={details}
        mode="panel"
        onOpenChange={(open) => !open && setDetails(null)}
        onAdd={addToResume}
      />
    </div>
  )

  if (variant === 'sheet') {
    return (
      <div className="fixed inset-0 z-40 bg-app-background text-slate-100 xl:hidden">
        {content}
      </div>
    )
  }

  return content
}
