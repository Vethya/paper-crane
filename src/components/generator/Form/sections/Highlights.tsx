'use client'

import { PointerEvent, useRef, useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtom, useAtomValue } from 'jotai'
import { MdClose, MdDragIndicator } from 'react-icons/md'
import { Check, RotateCcw } from 'lucide-react'
import { Input } from '../../../core/Input'
import { FormInput } from '../../../core/FormInput'
import { IconButton } from '../../../core/Button'
import {
  agentPendingEditsAtom,
  type FieldEdit
} from '../../../../atoms/agentEdits'
import { formSetValueAtom } from '../../../../atoms/formData'
import { useAdvanceFocusedEdit } from '../../../../hooks/useAdvanceFocusedEdit'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface HighlightsProps {
  label: string
  name: `work.${number}.highlights`
  placeholder: string
  className?: string
}

export default function Highlights({
  name,
  label,
  placeholder,
  className
}: HighlightsProps) {
  const { fields, append, move, remove } = useFieldArray({ name })
  const [pendingEdits, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const advanceFocusedEdit = useAdvanceFocusedEdit()
  const rowRefs = useRef<Array<HTMLDivElement | null>>([])
  const [dragState, setDragState] = useState<{
    sourceIndex: number
    targetIndex: number
    startY: number
    currentY: number
    itemTops: number[]
    itemMidpoints: number[]
  } | null>(null)

  const getFieldEdit = (index: number): FieldEdit | undefined =>
    pendingEdits.find(
      (e): e is FieldEdit =>
        e.type === 'set' &&
        e.fieldPath === `${name}.${index}` &&
        e.status === 'pending'
    )

  const handleApprove = (edit: FieldEdit) => {
    advanceFocusedEdit(edit.id)
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'approved' } : e))
    )
  }

  const handleReject = (edit: FieldEdit) => {
    if (!formSetValue) return
    advanceFocusedEdit(edit.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formSetValue(edit.fieldPath as any, (edit.originalValue ?? '') as string, {
      shouldDirty: true,
      shouldValidate: true
    })
    setPendingEdits((prev) =>
      prev.map((e) => (e.id === edit.id ? { ...e, status: 'rejected' } : e))
    )
  }

  const getTargetIndex = (
    pointerY: number,
    sourceIndex: number,
    itemMidpoints: number[]
  ) => {
    let nextIndex = sourceIndex

    itemMidpoints.forEach((midpoint, index) => {
      if (index === sourceIndex) return

      if (pointerY > midpoint) {
        nextIndex = Math.max(nextIndex, index)
      } else if (pointerY < midpoint) {
        nextIndex = Math.min(nextIndex, index)
      }
    })

    return nextIndex
  }

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.button !== 0) return

    const itemRects = rowRefs.current.map((row) => row?.getBoundingClientRect())
    const itemTops = itemRects.map((rect) => rect?.top ?? 0)
    const itemMidpoints = itemRects.map((rect) =>
      rect ? rect.top + rect.height / 2 : 0
    )

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.style.userSelect = 'none'

    setDragState({
      sourceIndex: index,
      targetIndex: index,
      startY: event.clientY,
      currentY: event.clientY,
      itemTops,
      itemMidpoints
    })
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    setDragState((current) => {
      if (!current) return current

      return {
        ...current,
        currentY: event.clientY,
        targetIndex: getTargetIndex(
          event.clientY,
          current.sourceIndex,
          current.itemMidpoints
        )
      }
    })
  }

  const finishDrag = () => {
    setDragState((current) => {
      if (current && current.sourceIndex !== current.targetIndex) {
        move(current.sourceIndex, current.targetIndex)
      }

      document.body.style.userSelect = ''
      return null
    })
  }

  const getPreviewIndex = (index: number) => {
    if (!dragState) return index

    const { sourceIndex, targetIndex } = dragState

    if (index === sourceIndex) return targetIndex
    if (
      sourceIndex < targetIndex &&
      index > sourceIndex &&
      index <= targetIndex
    ) {
      return index - 1
    }
    if (
      targetIndex < sourceIndex &&
      index >= targetIndex &&
      index < sourceIndex
    ) {
      return index + 1
    }

    return index
  }

  const getRowTransform = (index: number) => {
    if (!dragState) return undefined

    if (index === dragState.sourceIndex) {
      return `translate3d(0, ${dragState.currentY - dragState.startY}px, 0)`
    }

    const nextIndex = getPreviewIndex(index)
    const nextTop = dragState.itemTops[nextIndex]
    const currentTop = dragState.itemTops[index]

    if (nextTop === undefined || currentTop === undefined) return undefined

    return `translate3d(0, ${nextTop - currentTop}px, 0)`
  }

  return (
    <div className={twMerge(className)}>
      <label className="mb-2 block text-white">{label}</label>
      <div className="my-2 flex flex-col gap-2">
        {fields.map((field, i) => {
          const edit = getFieldEdit(i)

          return (
            <div
              key={field.id}
              ref={(node) => {
                rowRefs.current[i] = node
              }}
              style={{ transform: getRowTransform(i) }}
              className={twMerge(
                clsx(
                  'relative grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-2 rounded-app-button bg-app-background/40 p-1 transition-[transform,background-color,box-shadow] duration-200 ease-out',
                  dragState?.sourceIndex === i
                    ? 'z-20 bg-app-surface shadow-lg shadow-black/20 transition-none'
                    : dragState && 'z-10'
                )
              )}
            >
              <IconButton
                type="button"
                aria-label={`Reorder ${label.toLowerCase()} ${i + 1}`}
                onPointerDown={(event) => handlePointerDown(event, i)}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                className="h-11 touch-none justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-white"
              >
                <MdDragIndicator />
              </IconButton>
              <div
                className="flex min-w-0 flex-col gap-1"
                data-field-path={`${name}.${i}`}
              >
                <div
                  className={clsx(
                    'rounded transition-shadow',
                    edit &&
                      'ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                  )}
                >
                  <Input
                    name={`${name}.${i}`}
                    placeholder={placeholder}
                    className="min-w-0"
                  />
                </div>
                {edit && (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-xs text-amber-300/80 italic leading-snug">
                      {edit.reason}
                    </p>
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
              <IconButton
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => remove(i)}
                className="h-11 justify-center text-slate-300 hover:text-white"
              >
                <MdClose />
              </IconButton>
            </div>
          )
        })}
        <FormInput
          className={fields.length > 0 ? 'ml-[3.25rem]' : ''}
          onSubmit={append}
        />
      </div>
    </div>
  )
}
