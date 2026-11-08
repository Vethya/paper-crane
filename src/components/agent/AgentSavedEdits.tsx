'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { agentOpenAtom, agentResumeIdAtom } from '@/atoms/agentAtom'
import {
  agentEditSummaryAtom,
  agentFocusedEditIdAtom,
  agentPendingEditsAtom,
  agentReviewTargetAtom
} from '@/atoms/agentEdits'
import { formDataAtom, formSetValueAtom } from '@/atoms/formData'
import { loadedResumeIdAtom } from '@/atoms/resume'
import { authClient } from '@/db/auth-client'
import { isGenerating } from '@/lib/agentLimits'
import { markAgentEdits } from '@/lib/markAgentEdits'
import {
  findConflicts,
  type StoredEdit,
  type StoredTailoring
} from '@/lib/agentTailoring'
import { applyAgentEdits } from './applyAgentEdits'

type Saved = {
  id: string
  replyId?: string
  summary: string
  edits: StoredEdit[]
}
type Listed = {
  _id: string
  generatingSince?: string
  pendingEdits?: StoredTailoring
}
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
  const reviewTarget = useAtomValue(agentReviewTargetAtom)
  const loadedResumeId = useAtomValue(loadedResumeIdAtom)
  const formData = useAtomValue(formDataAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const setPendingEdits = useSetAtom(agentPendingEditsAtom)
  const setSummary = useSetAtom(agentEditSummaryAtom)
  const setFocusedId = useSetAtom(agentFocusedEditIdAtom)
  const setReviewTarget = useSetAtom(agentReviewTargetAtom)
  const { data: session } = authClient.useSession()
  const [saved, setSaved] = useState<Saved | null>(null)
  const [conflicts, setConflicts] = useState<StoredEdit[] | null>(null)
  const [checks, setChecks] = useState(0)
  // A dismissal still being recorded. Checking meanwhile would offer it again.
  const [marking, setMarking] = useState(false)
  // Edits must land in this resume's own form, not one still loading, and the
  // last review must be saved and marked before its result stops being
  // offered. Until then a check could offer it, and its new entries, again.
  const idle =
    !!session &&
    !!resumeId &&
    loadedResumeId === resumeId &&
    !open &&
    !reviewing &&
    !reviewTarget &&
    !marking

  // Check again whenever the overlay closes or a review ends.
  useEffect(() => {
    if (!idle) return
    let current = true
    let timer: ReturnType<typeof setTimeout> | undefined
    fetch(`/api/agent/sessions?resumeId=${resumeId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Listed[]) => {
        const ready = list.find((s) => s.pendingEdits?.status === 'ready')
        if (!current) return
        setConflicts(null)
        setSaved(ready ? { id: ready._id, ...ready.pendingEdits! } : null)
        // A reply that is still running may finish while the user is here.
        if (list.some((s) => isGenerating(s.generatingSince)))
          timer = setTimeout(() => setChecks((n) => n + 1), 3000)
      })
      .catch((err) => console.error('[AgentSavedEdits] Load error:', err))
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [idle, resumeId, checks])

  if (!idle || !saved || !formData) return null

  const dismiss = () => {
    setSaved(null)
    setMarking(true)
    void markAgentEdits(
      {
        resumeId: resumeId!,
        sessionId: saved.id,
        replyId: saved.replyId ?? null
      },
      'dismissed'
    ).then(() => setMarking(false))
  }
  const review = (edits: StoredEdit[]) => {
    const pending = applyAgentEdits(formData, edits, formSetValue)
    setPendingEdits(pending)
    setSummary(saved.summary)
    setFocusedId(pending[0]?.id ?? null)
    // Marked reviewed once the resume holds the user's decisions.
    setReviewTarget({
      resumeId: resumeId!,
      sessionId: saved.id,
      replyId: saved.replyId ?? null
    })
    setSaved(null)
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
              onClick={dismiss}
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
