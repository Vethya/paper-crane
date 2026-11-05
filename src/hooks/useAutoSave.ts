'use client'

import { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'
import { loadedResumeIdAtom } from '@/atoms/resume'
import { patchResume, useResumeSaver } from './useResumeSaver'

export type { SaveState } from '@/atoms/saveState'

const saveContent = (resumeId: string, snapshot: string) =>
  patchResume(resumeId, `{"content":${snapshot}}`)

export function useAutoSave(
  resumeId: string | null,
  formData: FormValues | null
) {
  const saveState = useAtomValue(saveStateAtom)
  const paused = useAtomValue(agentPendingEditsAtom).some(
    (e) => e.status === 'pending'
  )
  const loadedResumeId = useAtomValue(loadedResumeIdAtom)
  const saverRef = useResumeSaver(resumeId, saveContent)

  useEffect(() => {
    const saver = saverRef.current
    // Wait for this resume's server copy. Until then formData can hold an
    // earlier visit's form, which must not become the baseline.
    if (!saver || !formData || loadedResumeId !== resumeId) return

    // Pause auto-save while agent edits are pending review.
    // Any form changes (agent-applied or manual) will save together once resolved.
    if (paused) return saver.cancel()

    // The first snapshot is the loaded resume, which needs no save.
    saver.update(JSON.stringify(formData))
  }, [saverRef, resumeId, loadedResumeId, formData, paused])

  return saveState
}
