"use client"

import { useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'

export type { SaveState } from '@/atoms/saveState'

export function useAutoSave(resumeId: string | null, formData: FormValues | null) {
  const saveState = useAtomValue(saveStateAtom)
  const setSaveState = useSetAtom(saveStateAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const latestFormData = useRef(formData)
  const lastKnownData = useRef<string | null>(null)

  useEffect(() => {
    latestFormData.current = formData
  }, [formData])

  // Reset lastKnownData when navigating to a different resume
  useEffect(() => {
    lastKnownData.current = null
  }, [resumeId])

  useEffect(() => {
    if (!resumeId || !formData) return

    // Pause auto-save while agent edits are pending review.
    // Any form changes (agent-applied or manual) will save together once resolved.
    if (pendingEdits.some((e) => e.status === 'pending')) return

    const serialized = JSON.stringify(formData)

    // First load: store as baseline, don't save
    if (lastKnownData.current === null) {
      lastKnownData.current = serialized
      return
    }

    // Section switch or field registration: values unchanged, don't save
    if (serialized === lastKnownData.current) return

    const timer = setTimeout(async () => {
      setSaveState('saving')
      try {
        const res = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: latestFormData.current }),
        })
        if (!res.ok) throw new Error()
        lastKnownData.current = JSON.stringify(latestFormData.current)
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 2000)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [resumeId, formData, pendingEdits, setSaveState])

  return saveState
}
