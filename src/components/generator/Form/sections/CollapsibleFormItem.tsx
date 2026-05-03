import { ReactNode } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

import { Divider } from '../../../core/Divider'

interface CollapsibleFormItemProps {
  children: ReactNode
  isExpanded: boolean
  onToggle: () => void
  onRemove?: () => void
  removeDisabled?: boolean
  removeLabel?: string
  summaryTitle: string
  summaryDetail?: string
}

export function CollapsibleFormItem({
  children,
  isExpanded,
  onToggle,
  onRemove,
  removeDisabled = false,
  removeLabel = 'Remove item',
  summaryTitle,
  summaryDetail
}: CollapsibleFormItemProps) {
  const Icon = isExpanded ? ChevronUp : ChevronDown

  return (
    <>
      <div className="-mx-1.5 overflow-hidden rounded-lg border border-white/10 bg-slate-900/60 transition hover:border-blue-500/40 sm:-mx-3">
        <div className="flex w-full items-center gap-2 px-1.5 py-3 transition hover:bg-slate-900 sm:px-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="min-w-0 max-w-full flex-1 overflow-hidden text-left focus:outline-none"
          >
            <span className="block min-w-0 max-w-full overflow-hidden">
              <span className="block truncate text-sm font-medium text-slate-100">
                {summaryTitle}
              </span>
              {summaryDetail && (
                <span className="mt-1 block max-w-full truncate text-xs text-slate-400">
                  {summaryDetail}
                </span>
              )}
            </span>
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={removeDisabled}
              aria-label={removeLabel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-red-400 transition hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={isExpanded ? 'Collapse item' : 'Expand item'}
            aria-expanded={isExpanded}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isExpanded
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-1.5 pb-4 pt-2 sm:px-3">{children}</div>
          </div>
        </div>
      </div>
      <Divider />
    </>
  )
}
