'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useQueryAccount } from '@/components/providers/QueryProvider'
import { saveResume, trackResumeWork } from '@/lib/resumeCache'
import { useSetAtom } from 'jotai'
import { saveStateAtom } from '@/atoms/saveState'
import { createAutoSaver, type AutoSaver } from '@/lib/autoSaver'

export function usePatchResume() {
  const client = useQueryClient()
  const account = useQueryAccount()
  return useCallback(
    (id: string, body: string) => {
      if (!account)
        return Promise.reject(new Error('Sign in to save this resume'))
      return saveResume(client, account, id, body)
    },
    [client, account]
  )
}

// Keeps one saver per resume. Leaving the page, hiding the tab, or switching
// resumes flushes it instead of dropping the debounced edit.
export function useResumeSaver(
  resumeId: string | null,
  save: (resumeId: string, snapshot: string, revision: number) => Promise<void>,
  baseline?: string
) {
  const client = useQueryClient()
  const setSaveState = useSetAtom(saveStateAtom)
  const saverRef = useRef<AutoSaver | null>(null)

  useEffect(() => {
    if (!resumeId) return
    let attached = true
    const saver = createAutoSaver({
      save: (snapshot, revision) => save(resumeId, snapshot, revision),
      onStatus: (status) => {
        if (attached) setSaveState(status)
      },
      baseline
    })
    saverRef.current = saver
    const flush = () => trackResumeWork(client, resumeId, saver.flush())

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const handlePageHide = () => saver.sendPending()
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!saver.hasUnsavedChanges()) return
      void flush()
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
      void flush()
    }
  }, [resumeId, save, baseline, setSaveState, client])

  return saverRef
}
