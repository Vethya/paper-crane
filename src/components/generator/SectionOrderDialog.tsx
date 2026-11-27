'use client'

import { useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { MoveDown, MoveUp } from 'lucide-react'
import { formDataAtom, formSetValueAtom } from '@/atoms/formData'
import {
  movableSections,
  moveSection,
  SECTION_LABELS,
  type SectionId
} from '@/lib/sectionOrder'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

// Writes through the form's setValue, so autosave and auto-render see it.
export function useSectionOrder() {
  const order = useAtomValue(formDataAtom)?.sections
  const setValue = useAtomValue(formSetValueAtom)
  const move = useCallback(
    (section: SectionId, toIndex: number) =>
      setValue?.('sections', moveSection(order, section, toIndex), {
        shouldDirty: true
      }),
    [order, setValue]
  )
  return {
    sections: movableSections(order),
    move,
    canReorder: !!order && !!setValue
  }
}

interface MoveButtonProps {
  direction: 'up' | 'down'
  label: string
  disabled: boolean
  onClick: () => void
}

export function MoveButton({
  direction,
  label,
  disabled,
  onClick
}: MoveButtonProps) {
  const Icon = direction === 'up' ? MoveUp : MoveDown
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Move ${label} ${direction}`}
      className="flex h-6 w-6 items-center justify-center rounded-app-button text-slate-400 transition hover:bg-app-control hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}

interface SectionOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SectionOrderDialog({
  open,
  onOpenChange
}: SectionOrderDialogProps) {
  const { sections, move, canReorder } = useSectionOrder()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs border border-app-border bg-app-surface text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-sm text-white">
            Section order
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Profile always stays at the top.
          </DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-1">
          {sections.map((section, index) => (
            <li
              key={section}
              className="flex items-center justify-between rounded-app-card border border-app-border px-3 py-1.5 text-sm text-slate-200"
            >
              {SECTION_LABELS[section]}
              <span className="flex gap-0.5">
                <MoveButton
                  direction="up"
                  label={SECTION_LABELS[section]}
                  disabled={!canReorder || index === 0}
                  onClick={() => move(section, index - 1)}
                />
                <MoveButton
                  direction="down"
                  label={SECTION_LABELS[section]}
                  disabled={!canReorder || index === sections.length - 1}
                  onClick={() => move(section, index + 2)}
                />
              </span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  )
}
