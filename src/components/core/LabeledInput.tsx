'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Check, RotateCcw } from 'lucide-react'
import type { FieldPath, Path } from 'react-hook-form'
import { agentPendingEditsAtom, type FieldEdit } from '../../atoms/agentEdits'
import { formSetValueAtom } from '../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../hooks/useAdvanceFocusedEdit'
import { Input, Textarea } from './Input'
import type { FormValues } from '../../types'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface Props {
  name: FieldPath<FormValues>
  label: string
  placeholder?: string
  type?: string
  disabled?: boolean
  autoComplete?: string
  className?: string
  multiline?: boolean
  textareaRows?: number
}

export function LabeledInput({
  label,
  className,
  multiline = false,
  textareaRows,
  type,
  ...inputProps
}: Props) {
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()

  const fieldEdit = pendingEdits.find(
    (e): e is FieldEdit =>
      e.type === 'set' &&
      e.fieldPath === inputProps.name &&
      e.status === 'pending'
  )

  const handleApprove = () => {
    if (!fieldEdit) return
    advanceFocusedEdit(fieldEdit.id)
    setPendingEdits((prev) =>
      prev.map((e) =>
        e.id === fieldEdit.id ? { ...e, status: 'approved' } : e
      )
    )
  }

  const handleReject = () => {
    if (!fieldEdit || !formSetValue) return
    advanceFocusedEdit(fieldEdit.id)
    formSetValue(
      fieldEdit.fieldPath as Path<FormValues>,
      (fieldEdit.originalValue ?? '') as string,
      {
        shouldDirty: true,
        shouldValidate: true
      }
    )
    setPendingEdits((prev) =>
      prev.map((e) =>
        e.id === fieldEdit.id ? { ...e, status: 'rejected' } : e
      )
    )
  }

  return (
    <div
      className={twMerge(
        clsx('flex flex-col mb-8 text-white last:mb-0', className)
      )}
      data-field-path={inputProps.name}
    >
      <label className="text-white mb-2">{label}</label>

      <div
        className={clsx(
          'rounded transition-shadow',
          fieldEdit && 'review-field-highlight'
        )}
      >
        {multiline ? (
          <Textarea {...inputProps} rows={textareaRows} />
        ) : (
          <Input {...inputProps} type={type} />
        )}
      </div>

      {fieldEdit && (
        <div className="mt-1.5 flex items-start gap-2">
          <p className="review-reason flex-1 text-xs italic leading-snug">
            {fieldEdit.reason}
          </p>
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
