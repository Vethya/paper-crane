'use client'

import { X, History, SquarePen } from 'lucide-react'

interface AgentOverlayHeaderProps {
  onClose: () => void
  onHistoryClick: () => void
  onNewChat: () => void
}

export function AgentOverlayHeader({ onClose, onHistoryClick, onNewChat }: AgentOverlayHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between px-4">
      <button
        onClick={onHistoryClick}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        <History className="h-4 w-4" />
        History
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={onNewChat}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          aria-label="New chat"
        >
          <SquarePen className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          aria-label="Close agent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
