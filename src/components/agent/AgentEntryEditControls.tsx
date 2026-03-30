'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Check, RotateCcw } from 'lucide-react'
import { agentPendingEditsAtom, type NewEntryEdit } from '../../atoms/agentEdits'
import { formSetValueAtom, formDataAtom } from '../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../hooks/useAdvanceFocusedEdit'

interface Props {
  edit: NewEntryEdit
}

export function AgentEntryEditControls({ edit }: Props) {
  const [, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const formData = useAtomValue(formDataAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()

  const handleKeep = () => {
    advanceFocusedEdit(edit.id)
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'approved' } : e))
    )
  }

  const handleRemove = () => {
    if (!formSetValue || !formData) return
    advanceFocusedEdit(edit.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = ((formData as any)[edit.arrayPath] ?? []) as unknown[]
    const trimmed = current.filter((_, i) => i !== edit.entryIndex)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(edit.arrayPath as any, trimmed as any, { shouldDirty: true, shouldValidate: true })
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'rejected' } : e))
    )
  }

  return (
    <div className="mt-1.5 flex items-start gap-2">
      <p className="flex-1 text-xs text-amber-300/80 italic leading-snug">{edit.reason}</p>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={handleKeep}
          title="Keep this entry"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
        >
          <Check className="h-3 w-3" />
          Keep
        </button>
        <button
          type="button"
          onClick={handleRemove}
          title="Remove this entry"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  )
}
