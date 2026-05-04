'use client'

import { X, History, SquarePen } from 'lucide-react'

interface AgentOverlayHeaderProps {
  onClose: () => void
  onHistoryClick: () => void
  onNewChat: () => void
}

export function AgentOverlayHeader({
  onClose,
  onHistoryClick,
  onNewChat
}: AgentOverlayHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between px-4">
      <button
        onClick={onHistoryClick}
        className="flex items-center gap-2 rounded-app-button border border-transparent px-3 py-1.5 text-sm text-slate-300 transition hover:border-app-controlBorder hover:bg-app-control hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <History className="h-4 w-4" />
        History
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={onNewChat}
          className="rounded-app-button border border-transparent p-1.5 text-slate-300 transition hover:border-app-controlBorder hover:bg-app-control hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="New chat"
        >
          <SquarePen className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="rounded-app-button border border-transparent p-1.5 text-slate-300 transition hover:border-app-controlBorder hover:bg-app-control hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close agent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
