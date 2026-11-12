'use client'

import { useAtom, useAtomValue } from 'jotai'
import type { FieldPath, Path } from 'react-hook-form'
import { agentPendingEditsAtom, type FieldEdit } from '../../atoms/agentEdits'
import { formSetValueAtom } from '../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../hooks/useAdvanceFocusedEdit'
import { Input, Textarea } from './Input'
import { EditReviewActions } from './EditReviewActions'
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
  invalid?: boolean
}

export function LabeledInput({
  label,
  className,
  multiline = false,
  textareaRows,
  invalid = false,
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
        clsx('mb-4 flex flex-col text-white last:mb-0', className)
      )}
      data-field-path={inputProps.name}
    >
      <label className="mb-1.5 text-[13px] font-medium text-slate-400">
        {label}
      </label>

      <div
        className={clsx(
          'rounded-app-button transition-shadow',
          invalid &&
            'ring-1 ring-red-400/80 shadow-[0_0_0_3px_rgba(248,113,113,0.14)]',
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
        <EditReviewActions
          reason={fieldEdit.reason}
          onKeep={handleApprove}
          onRestore={handleReject}
        />
      )}
    </div>
  )
}
