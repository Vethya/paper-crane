'use client'

import { useAtom, useAtomValue } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react'
import { agentPendingEditsAtom, agentEditSummaryAtom, agentFocusedEditIdAtom, type NewEntryEdit } from '../../atoms/agentEdits'
import { formSetValueAtom, formDataAtom } from '../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../hooks/useAdvanceFocusedEdit'

const ARRAY_LABELS: Record<NewEntryEdit['arrayPath'], string> = {
  work: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Project',
  awards: 'Award'
}

function entryTitle(edit: NewEntryEdit): string {
  const e = edit.entry
  if (edit.arrayPath === 'work') return `${e.position ?? 'New role'} at ${e.company ?? '?'}`
  if (edit.arrayPath === 'education') return `${e.area ?? e.studyType ?? 'New degree'} at ${e.institution ?? '?'}`
  if (edit.arrayPath === 'skills') return `${e.name ?? 'New skill'}`
  if (edit.arrayPath === 'projects') return `${e.name ?? 'New project'}`
  if (edit.arrayPath === 'awards') return `${e.title ?? 'New award'}`
  return 'New entry'
}

export function AgentEditReviewBar() {
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const summary = useAtomValue(agentEditSummaryAtom)
  const [focusedId, setFocusedId] = useAtom(agentFocusedEditIdAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const formData = useAtomValue(formDataAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()

  const pendingList = pendingEdits.filter((e) => e.status === 'pending')
  const pendingCount = pendingList.length
  const newEntryEdits = pendingList.filter((e): e is NewEntryEdit => e.type === 'append')

  const focusedIdx = pendingList.findIndex((e) => e.id === focusedId)
  const displayIdx = focusedIdx === -1 ? 0 : focusedIdx

  const goTo = (idx: number) => {
    const edit = pendingList[idx]
    if (edit) setFocusedId(edit.id)
  }

  const approveAll = () => {
    setFocusedId(null)
    setPendingEdits((prev) => prev.map((e) => ({ ...e, status: 'approved' })))
  }

  const rejectAll = () => {
    if (!formSetValue || !formData) return
    setFocusedId(null)

    for (const edit of pendingEdits) {
      if (edit.type === 'set' && edit.status === 'pending') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formSetValue(edit.fieldPath as any, (edit.originalValue ?? '') as string, {
          shouldDirty: true,
          shouldValidate: true
        })
      }
    }

    const indicesToRemove = new Map<string, Set<number>>()
    for (const edit of pendingEdits) {
      if (edit.type === 'append' && edit.status === 'pending') {
        if (!indicesToRemove.has(edit.arrayPath)) indicesToRemove.set(edit.arrayPath, new Set())
        indicesToRemove.get(edit.arrayPath)!.add(edit.entryIndex)
      }
    }

    for (const [arrayPath, indices] of indicesToRemove) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = ((formData as any)[arrayPath] ?? []) as unknown[]
      const filtered = current.filter((_, i) => !indices.has(i))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formSetValue(arrayPath as any, filtered as any, { shouldDirty: true, shouldValidate: true })
    }

    setPendingEdits((prev) => prev.map((e) => ({ ...e, status: 'rejected' })))
  }

  const approveEntry = (edit: NewEntryEdit) => {
    advanceFocusedEdit(edit.id)
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'approved' } : e))
    )
  }

  const rejectEntry = (edit: NewEntryEdit) => {
    if (!formSetValue || !formData) return
    advanceFocusedEdit(edit.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = ((formData as any)[edit.arrayPath] ?? []) as unknown[]
    const trimmed = current.filter((_, i) => i !== edit.entryIndex)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(edit.arrayPath as any, trimmed as any, { shouldDirty: true, shouldValidate: true })
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'rejected' } : e))
    )
  }

  return (
    <AnimatePresence>
      {pendingCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-400/20 bg-slate-950/95 backdrop-blur-sm shadow-[0_-4px_32px_rgba(0,0,0,0.5)]"
        >
          <div className="mx-auto max-w-4xl px-4 py-3">
            {/* Summary row */}
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="flex-1 text-sm text-slate-200 truncate">
                <span className="font-medium text-amber-300">{pendingCount} change{pendingCount !== 1 ? 's' : ''} to review</span>
                {summary && <span className="text-slate-400"> — {summary}</span>}
              </p>

              {/* Prev / counter / Next */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => goTo(displayIdx - 1)}
                  disabled={displayIdx === 0}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
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

            {/* New entry cards */}
            {newEntryEdits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {newEntryEdits.map((edit) => (
                  <div
                    key={edit.id}
                    className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 px-3 py-1.5"
                  >
                    <span className="text-xs text-amber-300/70 uppercase tracking-wide font-medium">
                      New {ARRAY_LABELS[edit.arrayPath]}
                    </span>
                    <span className="text-xs text-slate-300">{entryTitle(edit)}</span>
                    <span className="text-xs text-slate-500 italic hidden sm:inline">— {edit.reason}</span>
                    <div className="flex gap-1 ml-1">
                      <button
                        type="button"
                        onClick={() => approveEntry(edit)}
                        title="Keep this entry"
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectEntry(edit)}
                        title="Remove this entry"
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
                        >
                        <RotateCcw className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
