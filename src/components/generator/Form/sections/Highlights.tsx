'use client'

import { PointerEvent, useRef, useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtom, useAtomValue } from 'jotai'
import { MdClose, MdDragIndicator } from 'react-icons/md'
import { EditReviewActions } from '../../../core/EditReviewActions'
import { Textarea } from '../../../core/Input'
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
      <label className="mb-1.5 block text-[13px] font-medium text-slate-400">
        {label}
      </label>
      <div className="flex flex-col gap-1.5">
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
                  'group/highlight relative grid grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-start gap-1.5 rounded-app-button transition-[transform,background-color,box-shadow] duration-200 ease-out',
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
                className="h-9 touch-none justify-center cursor-grab text-slate-500 opacity-60 transition-opacity hover:text-white group-hover/highlight:opacity-100 active:cursor-grabbing"
              >
                <MdDragIndicator />
              </IconButton>
              <div
                className="flex min-w-0 flex-col gap-1"
                data-field-path={`${name}.${i}`}
              >
                <div
                  className={clsx(
                    'rounded-app-button transition-shadow',
                    edit && 'review-field-highlight'
                  )}
                >
                  <Textarea
                    name={`${name}.${i}`}
                    placeholder={placeholder}
                    rows={2}
                    className="min-h-16 min-w-0"
                  />
                </div>
                {edit && (
                  <EditReviewActions
                    reason={edit.reason}
                    onKeep={() => handleApprove(edit)}
                    onRestore={() => handleReject(edit)}
                  />
                )}
              </div>
              <IconButton
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => remove(i)}
                className="h-9 justify-center text-slate-500 opacity-0 transition-opacity hover:text-white focus:opacity-100 group-hover/highlight:opacity-100"
              >
                <MdClose />
              </IconButton>
            </div>
          )
        })}
        <FormInput
          className={fields.length > 0 ? 'ml-[1.875rem] mr-[2.375rem]' : ''}
          onSubmit={append}
        />
      </div>
    </div>
  )
}
