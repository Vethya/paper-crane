'use client'

import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { saveStateAtom } from '@/atoms/saveState'
import { createAutoSaver, type AutoSaver } from '@/lib/autoSaver'

// Browsers cap keepalive request bodies at 64KB.
const KEEPALIVE_LIMIT = 60_000

export async function patchResume(resumeId: string, body: string) {
  const res = await fetch(`/api/resumes/${resumeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
    // Lets the save finish if the tab closes while it is running.
    keepalive: new TextEncoder().encode(body).length < KEEPALIVE_LIMIT
  })
  if (!res.ok) throw new Error(`Save failed with status ${res.status}`)
}

// Keeps one saver per resume. Leaving the page, hiding the tab, or switching
// resumes flushes it instead of dropping the debounced edit.
export function useResumeSaver(
  resumeId: string | null,
  save: (resumeId: string, snapshot: string) => Promise<void>,
  baseline?: string
) {
  const setSaveState = useSetAtom(saveStateAtom)
  const saverRef = useRef<AutoSaver | null>(null)

  useEffect(() => {
    if (!resumeId) return
    let attached = true
    const saver = createAutoSaver({
      save: (snapshot) => save(resumeId, snapshot),
      onStatus: (status) => {
        if (attached) setSaveState(status)
      },
      baseline
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
  }, [resumeId, save, baseline, setSaveState])

  return saverRef
}
