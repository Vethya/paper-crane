'use client'

import { useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'
import { clearDraft, writeDraft } from '@/lib/draftRecovery'
import type { AutoSaver } from '@/lib/autoSaver'
import { patchResume, useResumeSaver } from './useResumeSaver'

export type { SaveState } from '@/atoms/saveState'

async function saveContent(resumeId: string, snapshot: string) {
  await patchResume(resumeId, `{"content":${snapshot}}`)
  // The server has this content now, so its local backup is not needed.
  clearDraft(localStorage, resumeId, snapshot)
}

export function useAutoSave(
  resumeId: string | null,
  formData: FormValues | null
) {
  const saveState = useAtomValue(saveStateAtom)
  const paused = useAtomValue(agentPendingEditsAtom).some(
    (e) => e.status === 'pending'
  )
  const saverRef = useResumeSaver(resumeId, saveContent)
  // The saver whose baseline was set. The baseline is the loaded resume, so
  // it must not replace a backup that the generator may still offer back.
  const startedRef = useRef<AutoSaver | null>(null)
  // Read through a ref: a resume switch alone must not send the previous
  // resume's form data, which is still in formData until the new one loads.
  const resumeIdRef = useRef(resumeId)
  useEffect(() => {
    resumeIdRef.current = resumeId
  }, [resumeId])

  useEffect(() => {
    const saver = saverRef.current
    const resumeId = resumeIdRef.current
    if (!saver || !resumeId || !formData) return
    const snapshot = JSON.stringify(formData)
    const started = startedRef.current === saver
    startedRef.current = saver

    // Pause auto-save while agent edits are pending review.
    // Any form changes (agent-applied or manual) will save together once resolved.
    // Keep a local backup meanwhile, so leaving the page does not lose them.
    if (paused) {
      saver.cancel()
      if (started) writeDraft(localStorage, resumeId, snapshot)
      return
    }

    // The first snapshot is the loaded resume, which needs no save.
    saver.update(snapshot)
    if (!started) return
    if (saver.hasUnsavedChanges()) writeDraft(localStorage, resumeId, snapshot)
    else clearDraft(localStorage, resumeId)
  }, [saverRef, formData, paused])

  return saveState
}
