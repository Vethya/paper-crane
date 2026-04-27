import { DragEvent, useState } from 'react'
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
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    index: number
  ) => {
    setDraggingIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    event.preventDefault()
    const sourceIndex =
      draggingIndex ?? Number(event.dataTransfer.getData('text/plain'))

    if (!Number.isInteger(sourceIndex) || sourceIndex === targetIndex) {
      setDraggingIndex(null)
      return
    }

    move(sourceIndex, targetIndex)
    setDraggingIndex(null)
  }

  return (
    <div className={twMerge(clsx('', className))}>
      <label className="mb-2 block text-white">{label}</label>
      <div className="my-2 flex flex-col gap-2">
        {fields.map((field, i) => (
          <div
            key={field.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, i)}
            className={twMerge(
              clsx(
                'grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/40 p-1 transition',
                draggingIndex === i &&
                  'border-blue-500/70 bg-blue-500/10 opacity-70'
              )
            )}
          >
            <IconButton
              type="button"
              aria-label={`Reorder ${label.toLowerCase()} ${i + 1}`}
              draggable
              onDragStart={(event) => handleDragStart(event, i)}
              onDragEnd={() => setDraggingIndex(null)}
              className="h-11 justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-white"
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
