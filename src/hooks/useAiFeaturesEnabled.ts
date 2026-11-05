'use client'

import { useEffect, useState } from 'react'

// One request per page load, shared by every caller.
let statusRequest: Promise<boolean> | null = null

function fetchAiEnabled() {
  statusRequest ??= fetch('/api/agent/status')
    .then((res) => (res.ok ? res.json() : { enabled: false }))
    .then((body: { enabled?: unknown }) => body.enabled === true)
    .catch(() => false)
  return statusRequest
}

// False until the server confirms AI is on, so the agent UI never flashes.
export function useAiFeaturesEnabled() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let active = true
    fetchAiEnabled().then((value) => {
      if (active) setEnabled(value)
    })
    return () => {
      active = false
    }
  }, [])

  return enabled
}
