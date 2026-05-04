'use client'

import { useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import {
  agentPendingEditsAtom,
  agentEditSummaryAtom,
  agentFocusedEditIdAtom,
  type PendingEdit
} from '../../atoms/agentEdits'
import { formSetValueAtom, formDataAtom } from '../../atoms/formData'

const SECTION_LABELS: Record<string, string> = {
  basics: 'Personal info',
  headings: 'Section headings',
  work: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  awards: 'Awards'
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  email: 'Email',
  phone: 'Phone number',
  address: 'Location',
  website: 'Website',
  company: 'Company name',
  position: 'Position',
  location: 'Location',
  startDate: 'Start Date',
  endDate: 'End Date',
  highlights: 'Job Responsibilities',
  institution: 'School name',
  studyType: 'Degree',
  area: 'Major',
  score: 'GPA',
  keywords: 'Skill Details',
  description: 'Project Description',
  url: 'Link to Project',
  title: 'Award Name',
  date: 'Award Date',
  awarder: 'Awarder',
  summary: 'Summary'
}

function titleCase(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
}

function getValueAtPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (current == null) return undefined
    if (Array.isArray(current)) return current[Number(part)]
    if (typeof current === 'object')
      return (current as Record<string, unknown>)[part]
    return undefined
  }, source)
}

function getEntryTitle(
  arrayPath: string,
  entryIndex: number,
  formData: unknown,
  fallbackEntry?: Record<string, unknown>
) {
  const entry =
    (getValueAtPath(formData, `${arrayPath}.${entryIndex}`) as
      | Record<string, unknown>
      | undefined) ?? fallbackEntry

  if (!entry)
    return `${SECTION_LABELS[arrayPath] ?? titleCase(arrayPath)} ${entryIndex + 1}`

  const title =
    entry.company ??
    entry.institution ??
    entry.name ??
    entry.title ??
    entry.position ??
    entry.studyType

  return typeof title === 'string' && title.trim()
    ? title
    : `${SECTION_LABELS[arrayPath] ?? titleCase(arrayPath)} ${entryIndex + 1}`
}

function getReviewLocation(edit: PendingEdit, formData: unknown) {
  if (edit.type === 'append' || edit.type === 'remove') {
    const action = edit.type === 'append' ? 'New entry' : 'Entry removal'
    return {
      title: `${SECTION_LABELS[edit.arrayPath] ?? titleCase(edit.arrayPath)} > ${getEntryTitle(edit.arrayPath, edit.entryIndex, formData, edit.entry)}`,
      detail: action
    }
  }

  const parts = edit.fieldPath.split('.')
  const sectionKey = parts[0] === 'headings' ? parts[1] : parts[0]
  const section = SECTION_LABELS[sectionKey] ?? titleCase(sectionKey)

  if (parts[0] === 'basics') {
    const fieldKey = parts.at(-1) ?? ''
    return {
      title: `${section} > ${FIELD_LABELS[fieldKey] ?? titleCase(fieldKey)}`,
      detail: edit.reason
    }
  }

  if (parts[0] === 'headings') {
    return {
      title: `${section} > Section Heading`,
      detail: edit.reason
    }
  }

  const entryIndex = Number(parts[1])
  const fieldKey = parts[2] ?? ''
  const itemIndex = Number(parts[3])
  const entryTitle = Number.isNaN(entryIndex)
    ? null
    : getEntryTitle(parts[0], entryIndex, formData)
  const fieldLabel = FIELD_LABELS[fieldKey] ?? titleCase(fieldKey)
  const itemLabel = Number.isNaN(itemIndex) ? null : `Item ${itemIndex + 1}`

  return {
    title: [section, entryTitle, fieldLabel, itemLabel]
      .filter(Boolean)
      .join(' > '),
    detail: edit.reason
  }
}

export function AgentEditReviewBar() {
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const summary = useAtomValue(agentEditSummaryAtom)
  const [focusedId, setFocusedId] = useAtom(agentFocusedEditIdAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const formData = useAtomValue(formDataAtom)
  const [locationsOpen, setLocationsOpen] = useState(false)
  const previousPendingCountRef = useRef(0)

  const pendingList = pendingEdits.filter((e) => e.status === 'pending')
  const pendingCount = pendingList.length
  const focusedIdx = pendingList.findIndex((e) => e.id === focusedId)
  const displayIdx = focusedIdx === -1 ? 0 : focusedIdx

  useEffect(() => {
    if (previousPendingCountRef.current === 0 && pendingCount > 0) {
      setLocationsOpen(true)
    }
    previousPendingCountRef.current = pendingCount
  }, [pendingCount])

  const focusEdit = (id: string) => {
    if (focusedId === id) {
      setFocusedId(null)
      window.requestAnimationFrame(() => setFocusedId(id))
      return
    }

    setFocusedId(id)
  }

  const goTo = (idx: number) => {
    const edit = pendingList[idx]
    if (edit) focusEdit(edit.id)
  }

  const approveAll = () => {
    if (!formSetValue || !formData) return
    const setFormValue = formSetValue as (
      name: string,
      value: unknown,
      options: { shouldDirty: boolean; shouldValidate: boolean }
    ) => void
    setFocusedId(null)

    // Apply pending array-valued sets before marking all as approved. Text sets
    // are applied immediately when edits are generated, but keyword arrays are
    // normally applied by the Keywords component when that section mounts.
    for (const edit of pendingEdits) {
      if (
        edit.type === 'set' &&
        edit.status === 'pending' &&
        Array.isArray(edit.newValue)
      ) {
        setFormValue(edit.fieldPath, edit.newValue, {
          shouldDirty: true,
          shouldValidate: true
        })
      }
    }

    // Apply pending removals to the form before marking all as approved
    const removeMap = new Map<string, Set<number>>()
    for (const edit of pendingEdits) {
      if (edit.type === 'remove' && edit.status === 'pending') {
        if (!removeMap.has(edit.arrayPath))
          removeMap.set(edit.arrayPath, new Set())
        removeMap.get(edit.arrayPath)!.add(edit.entryIndex)
      }
    }
    for (const [arrayPath, indices] of removeMap) {
      const current = ((formData as Record<string, unknown>)[arrayPath] ??
        []) as unknown[]
      const filtered = current.filter((_, i) => !indices.has(i))
      setFormValue(arrayPath, filtered, {
        shouldDirty: true,
        shouldValidate: true
      })
    }

    setPendingEdits((prev) => prev.map((e) => ({ ...e, status: 'approved' })))
  }

  const rejectAll = () => {
    if (!formSetValue || !formData) return
    const setFormValue = formSetValue as (
      name: string,
      value: unknown,
      options: { shouldDirty: boolean; shouldValidate: boolean }
    ) => void
    setFocusedId(null)

    // Revert pending `set` edits
    for (const edit of pendingEdits) {
      if (edit.type === 'set' && edit.status === 'pending') {
        setFormValue(edit.fieldPath, edit.originalValue ?? '', {
          shouldDirty: true,
          shouldValidate: true
        })
      }
    }

    // Remove entries added by pending `append` edits (match by _agentEditId, not index)
    const idsToRemove = new Map<string, Set<string>>()
    for (const edit of pendingEdits) {
      if (edit.type === 'append' && edit.status === 'pending') {
        if (!idsToRemove.has(edit.arrayPath))
          idsToRemove.set(edit.arrayPath, new Set())
        idsToRemove.get(edit.arrayPath)!.add(edit.id)
      }
    }
    for (const [arrayPath, editIds] of idsToRemove) {
      const current = ((formData as Record<string, unknown>)[arrayPath] ??
        []) as Record<string, unknown>[]
      const filtered = current.filter(
        (e) => !editIds.has(e._agentEditId as string)
      )
      setFormValue(arrayPath, filtered, {
        shouldDirty: true,
        shouldValidate: true
      })
    }

    // `remove` edits: rejecting means keeping the entry — no form change needed

    setPendingEdits((prev) => prev.map((e) => ({ ...e, status: 'rejected' })))
  }

  return (
    <AnimatePresence>
      {pendingCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-400/20 bg-app-background/95 backdrop-blur-sm shadow-[0_-4px_32px_rgba(0,0,0,0.5)]"
        >
          <AnimatePresence>
            {locationsOpen && (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="fixed bottom-[6rem] left-4 right-4 z-50 mx-auto max-h-[min(60vh,24rem)] max-w-2xl overflow-hidden rounded-lg border border-amber-400/25 bg-app-background shadow-2xl shadow-black/50"
              >
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-medium text-slate-100">
                    Review locations
                  </p>
                </div>
                <div className="max-h-[calc(min(60vh,24rem)-3rem)] overflow-y-auto p-2">
                  {pendingList.map((edit, index) => {
                    const location = getReviewLocation(edit, formData)
                    const isFocused = edit.id === focusedId

                    return (
                      <button
                        key={edit.id}
                        type="button"
                        onClick={() => {
                          focusEdit(edit.id)
                          setLocationsOpen(false)
                        }}
                        className={`flex w-full min-w-0 items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                          isFocused
                            ? 'bg-amber-400/10 text-amber-100'
                            : 'text-slate-200 hover:bg-app-hover'
                        }`}
                      >
                        <span className="mt-0.5 min-w-[2rem] text-xs tabular-nums text-slate-500">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-snug">
                            {location.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs leading-snug text-slate-400">
                            {location.detail}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mx-auto max-w-4xl px-4 pb-5 pt-2">
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={() => setLocationsOpen((open) => !open)}
                className="flex h-6 w-32 items-center justify-center rounded-full border border-app-border bg-app-background text-slate-300 transition-colors hover:border-app-borderStrong hover:bg-app-hover hover:text-slate-100"
                title={
                  locationsOpen
                    ? 'Hide review locations'
                    : 'Show review locations'
                }
                aria-label={
                  locationsOpen
                    ? 'Hide review locations'
                    : 'Show review locations'
                }
                aria-expanded={locationsOpen}
              >
                <motion.span
                  animate={{ rotate: locationsOpen ? 180 : 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <ChevronUp className="h-4 w-4" />
                </motion.span>
              </button>
            </div>
            {/* Summary row */}
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="flex-1 text-sm text-slate-200 truncate">
                <span className="font-medium text-amber-300">
                  {pendingCount} change{pendingCount !== 1 ? 's' : ''} to review
                </span>
                {summary && (
                  <span className="text-slate-400"> — {summary}</span>
                )}
              </p>

              {/* Prev / counter / Next */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => goTo(displayIdx - 1)}
                  disabled={displayIdx === 0}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-app-hover hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous change"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs tabular-nums text-slate-400">
                  {displayIdx + 1} / {pendingCount}
                </span>
                <button
                  type="button"
                  onClick={() => goTo(displayIdx + 1)}
                  disabled={displayIdx >= pendingCount - 1}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-app-hover hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next change"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reject All
                </button>
                <button
                  type="button"
                  onClick={approveAll}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Approve All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
