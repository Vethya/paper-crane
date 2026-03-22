"use client"

import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { FormValues } from '@/types'
import { saveStateAtom } from '@/atoms/saveState'

export type { SaveState } from '@/atoms/saveState'

export function useAutoSave(resumeId: string | null, formData: FormValues | null) {
  const [saveState, setSaveState] = useAtom(saveStateAtom)
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
  }, [resumeId, formData, setSaveState])

  return saveState
}
