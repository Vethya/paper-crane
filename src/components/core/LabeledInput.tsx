'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Check, RotateCcw } from 'lucide-react'
import { agentPendingEditsAtom, type FieldEdit } from '../../atoms/agentEdits'
import { formSetValueAtom } from '../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../hooks/useAdvanceFocusedEdit'
import { Input, type InputProps } from './Input'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface Props extends Omit<InputProps, 'formContext'> {
  label: string
  className?: string
}

export function LabeledInput({ label, className, ...inputProps }: Props) {
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()

  const fieldEdit = pendingEdits.find(
    (e): e is FieldEdit =>
      e.type === 'set' && e.fieldPath === inputProps.name && e.status === 'pending'
  )

  const handleApprove = () => {
    if (!fieldEdit) return
    advanceFocusedEdit(fieldEdit.id)
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === fieldEdit.id ? { ...e, status: 'approved' } : e))
    )
  }

  const handleReject = () => {
    if (!fieldEdit || !formSetValue) return
    advanceFocusedEdit(fieldEdit.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(fieldEdit.fieldPath as any, (fieldEdit.originalValue ?? '') as string, {
      shouldDirty: true,
      shouldValidate: true
    })
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === fieldEdit.id ? { ...e, status: 'rejected' } : e))
    )
  }

  return (
    <div className={twMerge(clsx('flex flex-col mb-8 text-white last:mb-0', className))} data-field-path={inputProps.name}>
      <label className="text-white mb-2">{label}</label>

      <div
        className={clsx(
          'rounded transition-shadow',
          fieldEdit && 'ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
        )}
      >
        <Input {...inputProps} />
      </div>

      {fieldEdit && (
        <div className="mt-1.5 flex items-start gap-2">
          <p className="flex-1 text-xs text-amber-300/80 italic leading-snug">{fieldEdit.reason}</p>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={handleApprove}
              title="Keep this change"
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
            >
              <Check className="h-3 w-3" />
              Keep
            </button>
            <button
              type="button"
              onClick={handleReject}
              title="Restore original value"
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
