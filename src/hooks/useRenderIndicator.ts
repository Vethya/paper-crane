import { useEffect, useState } from 'react'

export function useRenderIndicator(
  rendering: boolean,
  hasPdf: boolean,
  error: boolean
): 'none' | 'spinner' | 'loading-engine' | 'error' {
  const [delayed, setDelayed] = useState(false)
  useEffect(() => {
    if (!rendering) return setDelayed(false)
    const timer = setTimeout(() => setDelayed(true), 400)
    return () => clearTimeout(timer)
  }, [rendering])
  if (error) return 'error'
  if (!rendering) return 'none'
  if (!hasPdf) return 'loading-engine'
  return delayed ? 'spinner' : 'none'
}
