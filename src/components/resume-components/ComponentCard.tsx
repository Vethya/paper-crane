'use client'

import { KeyboardEvent, MouseEvent, useRef } from 'react'
import { Edit2, GripVertical, Plus, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import {
  getComponentPreview,
  getComponentTitle,
  type ResumeComponent
} from '@/lib/resumeComponents'

interface ComponentCardProps {
  component: ResumeComponent
  mode: 'library' | 'panel'
  draggable?: boolean
  highlighted?: boolean
  onOpen: (component: ResumeComponent) => void
  onEdit?: (component: ResumeComponent) => void
  onDelete?: (component: ResumeComponent) => void
  onAdd?: (component: ResumeComponent) => void
  onDragStart?: (component: ResumeComponent) => void
}

export function ComponentCard({
  component,
  highlighted = false,
  mode,
  draggable = mode === 'panel',
  onOpen,
  onEdit,
  onDelete,
  onAdd,
  onDragStart
}: ComponentCardProps) {
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const title = getComponentTitle(component.type, component.content)
  const preview = getComponentPreview(component.type, component.content)

  function stopAction(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
  }

  return (
    <article
      draggable={draggable}
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onPointerDown={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY }
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          onOpen(component)
          return
        }

        const start = pointer.current
        if (start) {
          const moved =
            Math.abs(event.clientX - start.x) +
            Math.abs(event.clientY - start.y)
          if (moved > 8) return
        }
        onOpen(component)
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onOpen(component)
      }}
      onDragStart={(event) => {
        if (mode !== 'panel' || !draggable) return
        onDragStart?.(component)
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData(
          'application/x-resume-component',
          JSON.stringify({
            source: 'component-library',
            type: component.type,
            content: component.content
          })
        )
      }}
      className={clsx(
        'group flex min-h-32 cursor-pointer flex-col gap-3 rounded-lg border bg-app-surface p-4 transition hover:border-app-borderStrong hover:bg-app-surfaceElevated',
        highlighted
          ? 'border-emerald-400/80 shadow-[0_0_0_3px_rgba(52,211,153,0.14)]'
          : 'border-app-border'
      )}
    >
      <div className="flex items-start gap-3">
        {mode === 'panel' && draggable && (
          <GripVertical
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-medium text-white">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-400">
            {preview || 'No additional details'}
          </p>
        </div>
      </div>

      <div className="mt-auto flex justify-end gap-2">
        {mode === 'panel' && (
          <button
            type="button"
            onClick={(event) => {
              stopAction(event)
              onAdd?.(component)
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-app-button border border-white/80 bg-white px-3 text-xs font-medium text-app-background transition hover:bg-app-primaryHover"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
        {mode === 'library' && (
          <>
            <button
              type="button"
              aria-label="Edit component"
              onClick={(event) => {
                stopAction(event)
                onEdit?.(component)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-app-button border border-app-controlBorder bg-app-control text-slate-300 transition hover:bg-app-controlHover hover:text-white"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete component"
              onClick={(event) => {
                stopAction(event)
                onDelete?.(component)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-app-button border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </article>
  )
}
