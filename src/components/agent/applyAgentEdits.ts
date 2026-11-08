import type { FormValues } from '@/types'
import type { UseFormSetValue } from 'react-hook-form'
import type {
  FieldEdit,
  NewEntryEdit,
  PendingEdit,
  RemoveEntryEdit
} from '@/atoms/agentEdits'
import { getValueAtPath, type ModelEdit } from '@/lib/agentTailoring'

/**
 * Applies tailoring edits to the form for review and returns them as pending
 * edits. Set and append edits show in the form at once; removals wait for the
 * user to confirm.
 */
export function applyAgentEdits(
  resume: object,
  edits: ModelEdit[],
  formSetValue: UseFormSetValue<FormValues> | null
): PendingEdit[] {
  const pendingEdits: PendingEdit[] = []

  // Track the in-progress arrays so successive appends to the same path stack correctly
  const latestArrays: Record<string, unknown[]> = {}

  const getLatestArray = (arrayPath: string): unknown[] => {
    if (arrayPath in latestArrays) return latestArrays[arrayPath]
    return ((resume as Record<string, unknown>)[arrayPath] as unknown[]) ?? []
  }

  for (const edit of edits) {
    if (edit.type === 'set') {
      const originalValue = getValueAtPath(resume, edit.fieldPath)
      const fieldEdit: FieldEdit = {
        id: crypto.randomUUID(),
        type: 'set',
        fieldPath: edit.fieldPath,
        originalValue,
        newValue: edit.newValue,
        reason: edit.reason,
        status: 'pending'
      }
      pendingEdits.push(fieldEdit)

      // Apply immediately — user approves/rejects afterward
      if (formSetValue && typeof edit.newValue === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formSetValue(edit.fieldPath as any, edit.newValue, {
          shouldDirty: true,
          shouldValidate: true
        })
      }
      // Array values (keywords) are handled by Keywords.tsx via useEffect when pendingEdits updates
    } else if (edit.type === 'remove') {
      const arrayPath = edit.arrayPath as RemoveEntryEdit['arrayPath']
      const currentArray = getLatestArray(arrayPath)
      const entry = (currentArray[edit.index] ?? {}) as Record<string, unknown>
      const removeEdit: RemoveEntryEdit = {
        id: crypto.randomUUID(),
        type: 'remove',
        arrayPath,
        entryIndex: edit.index,
        entry,
        reason: edit.reason,
        status: 'pending'
      }
      pendingEdits.push(removeEdit)
      // Do NOT modify the form — entry stays visible until user confirms removal
    } else if (edit.type === 'append' || edit.type === 'appendSkill') {
      const arrayPath: NewEntryEdit['arrayPath'] =
        edit.type === 'appendSkill'
          ? 'skills'
          : (edit.arrayPath as NewEntryEdit['arrayPath'])
      const entry: Record<string, unknown> =
        edit.type === 'appendSkill'
          ? { name: edit.name, keywords: edit.keywords }
          : edit.entry
      const editId = crypto.randomUUID()
      // Stamp entry so we can find it by identity, not index
      entry._agentEditId = editId

      const currentLatest = getLatestArray(arrayPath)
      const entryIndex = currentLatest.length
      const newArray = [...currentLatest, entry]
      latestArrays[arrayPath] = newArray

      const newEntryEdit: NewEntryEdit = {
        id: editId,
        type: 'append',
        arrayPath,
        entryIndex,
        entry,
        reason: edit.reason,
        status: 'pending'
      }
      pendingEdits.push(newEntryEdit)

      // Apply immediately — append the new entry to the form
      if (formSetValue) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formSetValue(arrayPath as any, newArray as any, {
          shouldDirty: true,
          shouldValidate: true
        })
      }
    }
  }

  return pendingEdits
}
