'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../atoms/agentEdits'
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

  // Shared helper: remove the entry matching this edit from the form array
  const removeFromForm = () => {
    if (!formSetValue || !formData) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = ((formData as any)[edit.arrayPath] ?? []) as Record<
      string,
      unknown
    >[]
    const trimmed =
      edit.type === 'append'
        ? current.filter((e) => e._agentEditId !== edit.id)
        : current.filter((_, i) => i !== edit.entryIndex)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(edit.arrayPath as any, trimmed as any, {
      shouldDirty: true,
      shouldValidate: true
    })
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
        // Adjust indices for remaining remove edits in the same array,
        // since the form array just shrank by one
        if (
          e.type === 'remove' &&
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
        // Adjust indices for remaining remove edits in the same array,
        // since the form array just shrank by one
        if (
          e.type === 'remove' &&
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
        <p className="flex-1 text-xs leading-5 text-red-400">{edit.reason}</p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={handleRemoveKeep}
            title="Keep this entry"
            className="flex h-7 items-center gap-1 rounded-md bg-app-control px-2.5 text-xs font-medium text-white transition-colors hover:bg-app-controlHover"
          >
            <Check className="h-3 w-3" />
            Keep
          </button>
          <button
            type="button"
            onClick={handleRemoveConfirm}
            title="Confirm removal of this entry"
            className="flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
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
      <p className="review-reason flex-1 text-xs leading-5">{edit.reason}</p>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={handleAppendKeep}
          title="Keep this entry"
          className="flex h-7 items-center gap-1 rounded-md bg-app-control px-2.5 text-xs font-medium text-white transition-colors hover:bg-app-controlHover"
        >
          <Check className="h-3 w-3" />
          Keep
        </button>
        <button
          type="button"
          onClick={handleAppendRemove}
          title="Remove this entry"
          className="flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-app-control hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  )
}
