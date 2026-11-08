'use client'

import { useEffect, useRef } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'
import {
  agentPendingEditsAtom,
  agentReviewTargetAtom
} from '@/atoms/agentEdits'
import {
  markAgentEdits,
  reviewStatus,
  sendAgentEditsMark,
  type ReviewTarget
} from '@/lib/markAgentEdits'
import { loadedResumeIdAtom } from '@/atoms/resume'
import { browserStorage, clearDraft, writeDraft } from '@/lib/draftRecovery'
import type { AutoSaver } from '@/lib/autoSaver'
import { patchResume, useResumeSaver } from './useResumeSaver'

export type { SaveState } from '@/atoms/saveState'

// Identifies this page load, so the server can order its content saves.
const WRITER_ID = Math.random().toString(36).slice(2)

async function saveContent(
  resumeId: string,
  snapshot: string,
  revision: number
) {
  const writer = JSON.stringify({ id: WRITER_ID, revision })
  await patchResume(resumeId, `{"content":${snapshot},"writer":${writer}}`)
  // The server has this content now, so its local backup is not needed.
  clearDraft(browserStorage, resumeId, snapshot)
}

export function useAutoSave(
  resumeId: string | null,
  formData: FormValues | null
) {
  const saveState = useAtomValue(saveStateAtom)
  const edits = useAtomValue(agentPendingEditsAtom)
  const [reviewTarget, setReviewTarget] = useAtom(agentReviewTargetAtom)
  const paused = edits.some((e) => e.status === 'pending')
  const loadedResumeId = useAtomValue(loadedResumeIdAtom)
  const saverRef = useResumeSaver(resumeId, saveContent)
  // The saver whose baseline was set. The baseline is the loaded resume, so
  // it must not replace a backup that the generator may still offer back.
  const startedRef = useRef<AutoSaver | null>(null)
  // The review target whose mark request is running.
  const markingRef = useRef<ReviewTarget | null>(null)

  useEffect(() => {
    const saver = saverRef.current
    // Wait for this resume's server copy. Until then formData can hold an
    // earlier visit's form, which must not become the baseline.
    if (!saver || !resumeId || !formData || loadedResumeId !== resumeId) return
    const snapshot = JSON.stringify(formData)
    const started = startedRef.current === saver
    startedRef.current = saver

    // Pause auto-save while agent edits are pending review.
    // Any form changes (agent-applied or manual) will save together once resolved.
    // Keep a local backup meanwhile, so leaving the page does not lose them.
    if (paused) {
      saver.cancel()
      if (started) writeDraft(browserStorage, resumeId, snapshot)
      return
    }

    // The first snapshot is the loaded resume, which needs no save.
    saver.update(snapshot)
    if (!started) return
    if (saver.hasUnsavedChanges())
      writeDraft(browserStorage, resumeId, snapshot)
    else {
      clearDraft(browserStorage, resumeId)
      // Only a saved resume holds the decisions, so only now is the review done.
      // A result with no usable edits is done too, or it would never be marked.
      // The target stays set while the request runs, so it is sent once.
      const target = reviewTarget
      if (target?.resumeId === resumeId && markingRef.current !== target) {
        markingRef.current = target
        void markAgentEdits(target, reviewStatus(edits)).then(() => {
          // Clear it even after a failure, so it cannot be retried forever.
          setReviewTarget((current) => (current === target ? null : current))
          if (markingRef.current === target) markingRef.current = null
        })
      }
    }
  }, [
    saverRef,
    resumeId,
    loadedResumeId,
    formData,
    paused,
    saveState,
    edits,
    reviewTarget,
    setReviewTarget
  ])

  // Leaving the page after deciding every edit must not leave the result
  // offered for review again, so send its mark as the page goes away.
  useEffect(() => {
    if (paused || reviewTarget?.resumeId !== resumeId) return
    const target = reviewTarget
    const status = reviewStatus(edits)
    const handlePageHide = () => sendAgentEditsMark(target, status)
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [paused, reviewTarget, resumeId, edits])

  // A result under review belongs to one resume. Another resume's saves
  // must never mark it, so drop it once a different resume is open.
  useEffect(() => {
    if (reviewTarget && resumeId && reviewTarget.resumeId !== resumeId)
      setReviewTarget(null)
  }, [reviewTarget, resumeId, setReviewTarget])

  return saveState
}
