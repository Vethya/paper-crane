'use client'

import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtom, useAtomValue } from 'jotai'
import { MdClose, MdDragIndicator } from 'react-icons/md'
import { Check, RotateCcw } from 'lucide-react'
import { Input } from '../../../core/Input'
import { FormInput } from '../../../core/FormInput'
import { IconButton } from '../../../core/Button'
import { agentPendingEditsAtom, type FieldEdit } from '../../../../atoms/agentEdits'
import { formSetValueAtom } from '../../../../atoms/formData'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface HighlightsProps {
  label: string
  name: `work.${number}.highlights`
  placeholder: string
  className?: string
}

export default function Highlights({ name, label, placeholder, className }: HighlightsProps) {
  const { fields, append, remove } = useFieldArray({ name })
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const formSetValue = useAtomValue(formSetValueAtom)

  const getFieldEdit = (index: number): FieldEdit | undefined =>
    pendingEdits.find(
      (e): e is FieldEdit =>
        e.type === 'set' && e.fieldPath === `${name}.${index}` && e.status === 'pending'
    )

  const handleApprove = (edit: FieldEdit) => {
    setPendingEdits((prev) => prev.map((e) => (e.id === edit.id ? { ...e, status: 'approved' } : e)))
  }

  const handleReject = (edit: FieldEdit) => {
    if (!formSetValue) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(edit.fieldPath as any, (edit.originalValue ?? '') as string, {
      shouldDirty: true,
      shouldValidate: true
    })
    setPendingEdits((prev) => prev.map((e) => (e.id === edit.id ? { ...e, status: 'rejected' } : e)))
  }

  return (
    <div className={twMerge(clsx('', className))}>
      <label className="block mb-2 text-white">{label}</label>
      <div className="grid grid-cols-[auto_1fr_auto] gap-1 my-2">
        {fields.map((field, i) => {
          const edit = getFieldEdit(i)
          return (
            <Fragment key={field.id}>
              <IconButton type="button" className="cursor-grab self-start mt-1">
                <MdDragIndicator />
              </IconButton>

              <div className="flex flex-col gap-1" data-field-path={`${name}.${i}`}>
                <div
                  className={clsx(
                    'rounded transition-shadow',
                    edit && 'ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                  )}
                >
                  <Input name={`${name}.${i}`} placeholder={placeholder} />
                </div>
                {edit && (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-xs text-amber-300/80 italic leading-snug">{edit.reason}</p>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => handleApprove(edit)}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/40 hover:bg-emerald-400/10 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(edit)}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-rose-400/40 hover:bg-rose-400/10 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <IconButton type="button" onClick={() => remove(i)} className="self-start mt-1">
                <MdClose />
              </IconButton>
            </Fragment>
          )
        })}
        <FormInput className="col-start-2 col-end-3" onSubmit={append} />
      </div>
    </div>
  )
}
