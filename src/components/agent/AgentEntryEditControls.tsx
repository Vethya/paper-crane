'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { agentPendingEditsAtom, type NewEntryEdit, type RemoveEntryEdit } from '../../atoms/agentEdits'
import { formSetValueAtom, formDataAtom } from '../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../hooks/useAdvanceFocusedEdit'

interface Props {
  edit: NewEntryEdit | RemoveEntryEdit
}

export function AgentEntryEditControls({ edit }: Props) {
  const [, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const formData = useAtomValue(formDataAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()

  // Shared helper: remove the entry at edit.entryIndex from the form array
  const removeFromForm = () => {
    if (!formSetValue || !formData) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = ((formData as any)[edit.arrayPath] ?? []) as unknown[]
    const trimmed = current.filter((_, i) => i !== edit.entryIndex)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(edit.arrayPath as any, trimmed as any, { shouldDirty: true, shouldValidate: true })
  }

  // ── append: Keep = approve (entry stays), Remove = reject (entry removed) ──

  const handleAppendKeep = () => {
    advanceFocusedEdit(edit.id)
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'approved' } : e))
    )
  }

  const handleAppendRemove = () => {
    advanceFocusedEdit(edit.id)
    removeFromForm()
    setPendingEdits((prev) =>
      prev.map((e) => {
        if (e.id === edit.id) return { ...e, status: 'rejected' as const }
        if (
          (e.type === 'append' || e.type === 'remove') &&
          e.arrayPath === edit.arrayPath &&
          e.status === 'pending' &&
          e.entryIndex > edit.entryIndex
        ) {
          return { ...e, entryIndex: e.entryIndex - 1 }
        }
        return e
      })
    )
  }

  // ── remove: Confirm = approve (entry deleted), Keep = reject (entry stays) ──

  const handleRemoveConfirm = () => {
    advanceFocusedEdit(edit.id)
    removeFromForm()
    setPendingEdits((prev) =>
      prev.map((e) => {
        if (e.id === edit.id) return { ...e, status: 'approved' as const }
        if (
          (e.type === 'append' || e.type === 'remove') &&
          e.arrayPath === edit.arrayPath &&
          e.status === 'pending' &&
          e.entryIndex > edit.entryIndex
        ) {
          return { ...e, entryIndex: e.entryIndex - 1 }
        }
        return e
      })
    )
  }

  const handleRemoveKeep = () => {
    advanceFocusedEdit(edit.id)
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'rejected' } : e))
    )
  }

  if (edit.type === 'remove') {
    return (
      <div className="mt-1.5 flex items-start gap-2">
        <p className="flex-1 text-xs text-rose-300/80 italic leading-snug">{edit.reason}</p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={handleRemoveKeep}
            title="Keep this entry"
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-slate-500/40 hover:bg-slate-700/50 transition-colors"
          >
            <Check className="h-3 w-3" />
            Keep
          </button>
          <button
            type="button"
            onClick={handleRemoveConfirm}
            title="Confirm removal of this entry"
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-1.5 flex items-start gap-2">
      <p className="flex-1 text-xs text-amber-300/80 italic leading-snug">{edit.reason}</p>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={handleAppendKeep}
          title="Keep this entry"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
        >
          <Check className="h-3 w-3" />
          Keep
        </button>
        <button
          type="button"
          onClick={handleAppendRemove}
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
