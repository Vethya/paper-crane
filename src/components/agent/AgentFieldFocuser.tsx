'use client'

import { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { agentFocusedEditIdAtom, agentPendingEditsAtom } from '../../atoms/agentEdits'
import { activeSectionSetterAtom } from '../../atoms/activeSection'

function fieldPathToSection(fieldPath: string): string {
  const prefix = fieldPath.split('.')[0]
  switch (prefix) {
    case 'basics': return 'basics'
    case 'work': return 'work'
    case 'education': return 'education'
    case 'skills': return 'skills'
    case 'projects': return 'projects'
    case 'awards': return 'awards'
    default: return 'basics'
  }
}

/**
 * Side-effect-only component rendered inside the Form.
 * Watches agentFocusedEditIdAtom and navigates the active section + scrolls
 * to the relevant field whenever the focused edit changes.
 */
export function AgentFieldFocuser() {
  const focusedId = useAtomValue(agentFocusedEditIdAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const setActiveSection = useAtomValue(activeSectionSetterAtom)

  useEffect(() => {
    if (!focusedId || !setActiveSection) return

    const edit = pendingEdits.find((e) => e.id === focusedId)
    if (!edit) return

    const section = edit.type === 'set' ? fieldPathToSection(edit.fieldPath) : edit.arrayPath
    setActiveSection(section)

    const fieldPath = edit.type === 'set' ? edit.fieldPath : null

    // Wait for the new section to render before scrolling
    const timer = setTimeout(() => {
      if (fieldPath) {
        const el = document.querySelector(`[data-field-path="${fieldPath}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (edit.type === 'append') {
        // Scroll to the specific appended entry container
        const el = document.querySelector(
          `[data-array-path="${edit.arrayPath}"][data-array-index="${edit.entryIndex}"]`
        )
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 60)

    return () => clearTimeout(timer)
  }, [focusedId]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
