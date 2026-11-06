'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { agentOpenAtom, agentResumeIdAtom } from '@/atoms/agentAtom'
import {
  agentEditSummaryAtom,
  agentFocusedEditIdAtom,
  agentPendingEditsAtom
} from '@/atoms/agentEdits'
import { formDataAtom, formSetValueAtom } from '@/atoms/formData'
import { authClient } from '@/db/auth-client'
import {
  findConflicts,
  type StoredEdit,
  type StoredTailoring
} from '@/lib/agentTailoring'
import { applyAgentEdits } from './applyAgentEdits'

type Saved = { id: string; summary: string; edits: StoredEdit[] }
const button =
  'rounded-app-button px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Offers tailoring results that finished on the server after the user left
 * that chat or resume, so they can still be reviewed.
 */
export function AgentSavedEdits() {
  const resumeId = useAtomValue(agentResumeIdAtom)
  const open = useAtomValue(agentOpenAtom)
  const reviewing = useAtomValue(agentPendingEditsAtom).some(
    (e) => e.status === 'pending'
  )
  const formData = useAtomValue(formDataAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const setPendingEdits = useSetAtom(agentPendingEditsAtom)
  const setSummary = useSetAtom(agentEditSummaryAtom)
  const setFocusedId = useSetAtom(agentFocusedEditIdAtom)
  const { data: session } = authClient.useSession()
  const [saved, setSaved] = useState<Saved | null>(null)
  const [conflicts, setConflicts] = useState<StoredEdit[] | null>(null)
  const idle = !!session && !!resumeId && !open && !reviewing

  // Check again whenever the overlay closes or a review ends.
  useEffect(() => {
    if (!idle) return
    let current = true
    fetch(`/api/agent/sessions?resumeId=${resumeId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Array<{ _id: string; pendingEdits?: StoredTailoring }>) => {
        const ready = list.find((s) => s.pendingEdits?.status === 'ready')
        if (!current) return
        setConflicts(null)
        setSaved(ready ? { id: ready._id, ...ready.pendingEdits! } : null)
      })
      .catch((err) => console.error('[AgentSavedEdits] Load error:', err))
    return () => {
      current = false
    }
  }, [idle, resumeId])

  if (!idle || !saved || !formData) return null

  const finish = (status: 'applied' | 'dismissed') => {
    setSaved(null)
    fetch(`/api/agent/sessions/${saved.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingEdits: status })
    }).catch((err) => console.error('[AgentSavedEdits] Save error:', err))
  }
  const review = (edits: StoredEdit[]) => {
    const pending = applyAgentEdits(formData, edits, formSetValue)
    setPendingEdits(pending)
    setSummary(saved.summary)
    setFocusedId(pending[0]?.id ?? null)
    finish('applied')
  }
  const startReview = () => {
    const found = findConflicts(formData, saved.edits)
    if (found.length) setConflicts(found)
    else review(saved.edits)
  }
  const count = saved.edits.length
  const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`

  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-3 rounded-app-card border border-app-controlBorder bg-app-surfaceElevated p-4 text-sm text-white shadow-lg shadow-black/25"
    >
      {conflicts ? (
        <>
          <p>
            {conflicts.length} of {plural(count)} are in fields you edited after
            tailoring started. Apply them anyway, or skip them and keep your
            edits?
          </p>
          <div className="flex justify-end gap-2">
            <button
              className={`${button} bg-app-control hover:bg-app-controlHover`}
              onClick={() =>
                review(saved.edits.filter((e) => !conflicts.includes(e)))
              }
            >
              Skip
            </button>
            <button
              className={`${button} bg-white text-app-background hover:bg-app-primaryHover`}
              onClick={() => review(saved.edits)}
            >
              Apply anyway
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Tailoring finished: {plural(count)} ready. {saved.summary}
          </p>
          <div className="flex justify-end gap-2">
            <button
              className={`${button} bg-app-control hover:bg-app-controlHover`}
              onClick={() => finish('dismissed')}
            >
              Dismiss
            </button>
            <button
              className={`${button} bg-white text-app-background hover:bg-app-primaryHover`}
              onClick={startReview}
            >
              Review
            </button>
          </div>
        </>
      )}
    </div>
  )
}
