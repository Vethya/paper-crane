import { ReactNode } from 'react'

import { Divider } from '../../../core/Divider'

interface CollapsibleFormItemProps {
  children: ReactNode
  isExpanded: boolean
  onExpand: () => void
  summaryTitle: string
  summaryDetail?: string
}

export function CollapsibleFormItem({
  children,
  isExpanded,
  onExpand,
  summaryTitle,
  summaryDetail
}: CollapsibleFormItemProps) {
  if (isExpanded) return <>{children}</>

  return (
    <>
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-left transition hover:border-blue-500/40 hover:bg-slate-900"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-100">
            {summaryTitle}
          </span>
          {summaryDetail && (
            <span className="mt-1 block truncate text-xs text-slate-400">
              {summaryDetail}
            </span>
          )}
        </span>
        <span className="shrink-0 text-xs font-medium text-blue-400">Edit</span>
      </button>
      <Divider />
    </>
  )
}
