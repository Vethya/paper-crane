'use client'

import { Fragment, useEffect, useRef } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useAtom } from 'jotai'
import { MdClose } from 'react-icons/md'
import { Check, RotateCcw } from 'lucide-react'
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
      <label className="mb-2 inline-block text-white">{label}</label>
      <FormInput onSubmit={append} />
      <div
        className={clsx(
          'my-2 rounded transition-shadow',
          fieldEdit &&
            'ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)] p-2'
        )}
      >
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-start gap-3 overflow-hidden">
          {fields.map((field, i) => (
            <Fragment key={field.id}>
              <div
                className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-app-button border py-1 pl-2 pr-2"
                style={{ borderColor: '#4b5563' }}
              >
                <span className="block min-w-0 max-w-full truncate">
                  {getValues(`${name}.${i}`)}
                </span>
                <IconButton
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0"
                >
                  <MdClose />
                </IconButton>
              </div>
            </Fragment>
          ))}
        </div>

        {fieldEdit && (
          <div className="mt-2 flex items-start gap-2">
            <p className="flex-1 text-xs text-amber-300/80 italic leading-snug">
              {fieldEdit.reason}
            </p>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
              >
                <Check className="h-3 w-3" />
                Keep
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Restore
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
