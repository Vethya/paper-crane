import { useCallback } from 'react'
import { useAtom } from 'jotai'
import {
  agentPendingEditsAtom,
  agentFocusedEditIdAtom
} from '../atoms/agentEdits'

/**
 * Returns a function that advances the focused edit to the next pending one
 * after the given resolvedId has been approved or rejected.
 * Looks forward first, falls back to earlier edits if at the end of the list.
 */
export function useAdvanceFocusedEdit() {
  const [pendingEdits] = useAtom(agentPendingEditsAtom)
  const [, setFocusedId] = useAtom(agentFocusedEditIdAtom)

  return useCallback(
    (resolvedId: string) => {
      const currentIdx = pendingEdits.findIndex((e) => e.id === resolvedId)
      const nextAfter = pendingEdits
        .slice(currentIdx + 1)
        .find((e) => e.status === 'pending' && e.id !== resolvedId)
      const fallback = pendingEdits
        .slice(0, currentIdx)
        .find((e) => e.status === 'pending' && e.id !== resolvedId)
      const next = nextAfter ?? fallback ?? null
      setFocusedId(next?.id ?? null)
    },
    [pendingEdits, setFocusedId]
  )
}
