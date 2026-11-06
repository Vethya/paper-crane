'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'
import { loadedResumeIdAtom } from '@/atoms/resume'
import { browserStorage, clearDraft, writeDraft } from '@/lib/draftRecovery'
import type { AutoSaver } from '@/lib/autoSaver'
import { usePatchResume, useResumeSaver } from './useResumeSaver'

export type { SaveState } from '@/atoms/saveState'

// Identifies this page load, so the server can order its content saves.
const WRITER_ID = Math.random().toString(36).slice(2)

export function useAutoSave(
  resumeId: string | null,
  formData: FormValues | null
) {
  const patchResume = usePatchResume()
  const saveContent = useCallback(
    async (id: string, snapshot: string, revision: number) => {
      const writer = JSON.stringify({ id: WRITER_ID, revision })
      const accepted = await patchResume(
        id,
        `{"content":${snapshot},"writer":${writer}}`
      )
      if (accepted) clearDraft(browserStorage, id, snapshot)
    },
    [patchResume]
  )
  const saveState = useAtomValue(saveStateAtom)
  const paused = useAtomValue(agentPendingEditsAtom).some(
    (e) => e.status === 'pending'
  )
  const loadedResumeId = useAtomValue(loadedResumeIdAtom)
  const saverRef = useResumeSaver(resumeId, saveContent)
  // The saver whose baseline was set. The baseline is the loaded resume, so
  // it must not replace a backup that the generator may still offer back.
  const startedRef = useRef<AutoSaver | null>(null)

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
    else clearDraft(browserStorage, resumeId)
  }, [saverRef, resumeId, loadedResumeId, formData, paused])

  return saveState
}
