'use client'

import { Fragment, useEffect, useRef } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useAtom } from 'jotai'
import { MdClose } from 'react-icons/md'
import { EditReviewActions } from '../../../core/EditReviewActions'
import { IconButton } from '../../../core/Button'
import { FormInput } from '../../../core/FormInput'
import {
  agentPendingEditsAtom,
  type FieldEdit
} from '../../../../atoms/agentEdits'
import { useAdvanceFocusedEdit } from '../../../../hooks/useAdvanceFocusedEdit'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface KeywordProps {
  label: string
  name: `${'skills' | 'projects'}.${number}.keywords`
  placeholder: string
  className?: string
}

export default function Keywords({
  name,
  label,
  placeholder,
  className
}: KeywordProps) {
  const { getValues } = useFormContext()
  const { fields, append, remove, replace } = useFieldArray({ name })
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()
  const appliedEditId = useRef<string | null>(null)

  const fieldEdit = pendingEdits.find(
    (e): e is FieldEdit =>
      e.type === 'set' && e.fieldPath === name && e.status === 'pending'
  )

  useEffect(() => {
    if (!fieldEdit || appliedEditId.current === fieldEdit.id) return
    if (Array.isArray(fieldEdit.newValue)) {
      appliedEditId.current = fieldEdit.id
      replace(fieldEdit.newValue as string[])
    }
  }, [fieldEdit, replace])

  const handleApprove = () => {
    if (!fieldEdit) return
    advanceFocusedEdit(fieldEdit.id)
    appliedEditId.current = null
    setPendingEdits((prev) =>
      prev.map((e) =>
        e.id === fieldEdit.id ? { ...e, status: 'approved' } : e
      )
    )
  }

  const handleReject = () => {
    if (!fieldEdit) return
    advanceFocusedEdit(fieldEdit.id)
    const original = fieldEdit.originalValue
    appliedEditId.current = null
    replace(Array.isArray(original) ? (original as string[]) : [])
    setPendingEdits((prev) =>
      prev.map((e) =>
        e.id === fieldEdit.id ? { ...e, status: 'rejected' } : e
      )
    )
  }

  return (
    <div className={twMerge(clsx('min-w-0', className))} data-field-path={name}>
      <label className="mb-1.5 inline-block text-[13px] font-medium text-slate-400">
        {label}
      </label>
      <FormInput onSubmit={append} />
      <div
        className={clsx(
          'mt-2 rounded-app-button transition-shadow',
          fieldEdit && 'review-field-highlight p-2'
        )}
      >
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-start gap-1.5 overflow-hidden">
          {fields.map((field, i) => (
            <Fragment key={field.id}>
              <div className="inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-app-button bg-app-control py-0.5 pl-2.5 pr-1 text-sm">
                <span className="block min-w-0 max-w-full truncate">
                  {getValues(`${name}.${i}`)}
                </span>
                <IconButton
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0 p-0.5 text-slate-400 hover:text-white"
                  aria-label={`Remove ${getValues(`${name}.${i}`)}`}
                >
                  <MdClose />
                </IconButton>
              </div>
            </Fragment>
          ))}
        </div>

        {fieldEdit && (
          <EditReviewActions
            reason={fieldEdit.reason}
            onKeep={handleApprove}
            onRestore={handleReject}
          />
        )}
      </div>
    </div>
  )
}
