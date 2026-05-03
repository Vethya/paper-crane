import { PointerEvent, useRef, useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import { MdClose, MdDragIndicator } from 'react-icons/md'
import { Input } from '../../../core/Input'
import { FormInput } from '../../../core/FormInput'
import { IconButton } from '../../../core/Button'
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
  const rowRefs = useRef<Array<HTMLDivElement | null>>([])
  const [dragState, setDragState] = useState<{
    sourceIndex: number
    targetIndex: number
    startY: number
    currentY: number
    itemTops: number[]
    itemMidpoints: number[]
  } | null>(null)

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
    <div className={twMerge(clsx('', className))}>
      <label className="mb-2 block text-white">{label}</label>
      <div className="my-2 flex flex-col gap-2">
        {fields.map((field, i) => (
          <div
            key={field.id}
            ref={(node) => {
              rowRefs.current[i] = node
            }}
            style={{ transform: getRowTransform(i) }}
            className={twMerge(
              clsx(
                'relative grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-lg bg-slate-950/40 p-1 transition-[transform,background-color,box-shadow] duration-200 ease-out',
                dragState?.sourceIndex === i
                  ? 'z-20 bg-slate-900 shadow-lg shadow-black/20 transition-none'
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
            <Input
              name={`${name}.${i}`}
              placeholder={placeholder}
              className="min-w-0 border-slate-700/80"
            />
            <IconButton
              type="button"
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
              onClick={() => remove(i)}
              className="h-11 justify-center text-slate-300 hover:text-white"
            >
              <MdClose />
            </IconButton>
          </div>
        ))}
        <FormInput
          className={fields.length > 0 ? 'ml-[3.25rem]' : ''}
          onSubmit={append}
        />
      </div>
    </div>
  )
}
