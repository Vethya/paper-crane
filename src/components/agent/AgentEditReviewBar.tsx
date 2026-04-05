'use client'

import { useAtom, useAtomValue } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react'
import { agentPendingEditsAtom, agentEditSummaryAtom, agentFocusedEditIdAtom } from '../../atoms/agentEdits'
import { formSetValueAtom, formDataAtom } from '../../atoms/formData'
export function AgentEditReviewBar() {
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const summary = useAtomValue(agentEditSummaryAtom)
  const [focusedId, setFocusedId] = useAtom(agentFocusedEditIdAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const formData = useAtomValue(formDataAtom)

  const pendingList = pendingEdits.filter((e) => e.status === 'pending')
  const pendingCount = pendingList.length
  const focusedIdx = pendingList.findIndex((e) => e.id === focusedId)
  const displayIdx = focusedIdx === -1 ? 0 : focusedIdx

  const goTo = (idx: number) => {
    const edit = pendingList[idx]
    if (edit) setFocusedId(edit.id)
  }

  const approveAll = () => {
    if (!formSetValue || !formData) return
    setFocusedId(null)

    // Apply pending removals to the form before marking all as approved
    const removeMap = new Map<string, Set<number>>()
    for (const edit of pendingEdits) {
      if (edit.type === 'remove' && edit.status === 'pending') {
        if (!removeMap.has(edit.arrayPath)) removeMap.set(edit.arrayPath, new Set())
        removeMap.get(edit.arrayPath)!.add(edit.entryIndex)
      }
    }
    for (const [arrayPath, indices] of removeMap) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = ((formData as any)[arrayPath] ?? []) as unknown[]
      const filtered = current.filter((_, i) => !indices.has(i))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formSetValue(arrayPath as any, filtered as any, { shouldDirty: true, shouldValidate: true })
    }

    setPendingEdits((prev) => prev.map((e) => ({ ...e, status: 'approved' })))
  }

  const rejectAll = () => {
    if (!formSetValue || !formData) return
    setFocusedId(null)

    // Revert pending `set` edits
    for (const edit of pendingEdits) {
      if (edit.type === 'set' && edit.status === 'pending') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formSetValue(edit.fieldPath as any, (edit.originalValue ?? '') as string, {
          shouldDirty: true,
          shouldValidate: true
        })
      }
    }

    // Remove entries added by pending `append` edits (match by _agentEditId, not index)
    const idsToRemove = new Map<string, Set<string>>()
    for (const edit of pendingEdits) {
      if (edit.type === 'append' && edit.status === 'pending') {
        if (!idsToRemove.has(edit.arrayPath)) idsToRemove.set(edit.arrayPath, new Set())
        idsToRemove.get(edit.arrayPath)!.add(edit.id)
      }
    }
    for (const [arrayPath, editIds] of idsToRemove) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = ((formData as any)[arrayPath] ?? []) as Record<string, unknown>[]
      const filtered = current.filter((e) => !editIds.has(e._agentEditId as string))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formSetValue(arrayPath as any, filtered as any, { shouldDirty: true, shouldValidate: true })
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
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-400/20 bg-slate-950/95 backdrop-blur-sm shadow-[0_-4px_32px_rgba(0,0,0,0.5)]"
        >
          <div className="mx-auto max-w-4xl px-4 py-3 mb-12">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
