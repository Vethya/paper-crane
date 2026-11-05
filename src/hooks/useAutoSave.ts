'use client'

import { useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'
import { createAutoSaver, type AutoSaver } from '@/lib/autoSaver'

export type { SaveState } from '@/atoms/saveState'

// Browsers cap keepalive request bodies at 64KB.
const KEEPALIVE_LIMIT = 60_000

async function saveResume(resumeId: string, snapshot: string) {
  const body = `{"content":${snapshot}}`
  const res = await fetch(`/api/resumes/${resumeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
    // Lets the save finish if the tab closes while it is running.
    keepalive: new TextEncoder().encode(body).length < KEEPALIVE_LIMIT
  })
  if (!res.ok) throw new Error(`Save failed with status ${res.status}`)
}

export function useAutoSave(
  resumeId: string | null,
  formData: FormValues | null
) {
  const saveState = useAtomValue(saveStateAtom)
  const setSaveState = useSetAtom(saveStateAtom)
  const paused = useAtomValue(agentPendingEditsAtom).some(
    (e) => e.status === 'pending'
  )
  const saverRef = useRef<AutoSaver | null>(null)

  // One saver per resume. Leaving the page or switching resumes flushes it
  // instead of dropping the debounced edit.
  useEffect(() => {
    if (!resumeId) return
    let attached = true
    const saver = createAutoSaver({
      save: (snapshot) => saveResume(resumeId, snapshot),
      onStatus: (status) => {
        if (attached) setSaveState(status)
      }
    })
    saverRef.current = saver

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void saver.flush()
    }
    const handlePageHide = () => saver.sendPending()
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!saver.hasUnsavedChanges()) return
      void saver.flush()
      event.preventDefault()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      attached = false
      saverRef.current = null
      setSaveState('idle')
      void saver.flush()
    }
  }, [resumeId, setSaveState])

  useEffect(() => {
    const saver = saverRef.current
    if (!saver || !formData) return

    // Pause auto-save while agent edits are pending review.
    // Any form changes (agent-applied or manual) will save together once resolved.
    if (paused) return saver.cancel()

    // The first snapshot is the loaded resume, which needs no save.
    saver.update(JSON.stringify(formData))
  }, [formData, paused])

  return saveState
}
