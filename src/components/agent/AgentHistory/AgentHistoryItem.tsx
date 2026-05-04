'use client'

import { Trash2 } from 'lucide-react'
import type { AgentMode } from '../../../atoms/agentAtom'

export type SessionPreview = {
  _id: string
  mode: AgentMode
  updatedAt: string
  preview: string
}

const MODE_BADGE_STYLES: Record<AgentMode, string> = {
  Chat: 'bg-slate-700 text-slate-300',
  Feedback: 'bg-amber-500/15 text-amber-400',
  Tailoring: 'bg-blue-500/15 text-blue-400',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

interface AgentHistoryItemProps {
  session: SessionPreview
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AgentHistoryItem({ session, onSelect, onDelete }: AgentHistoryItemProps) {
  return (
    <div className="group relative">
      <button
        onClick={() => onSelect(session._id)}
        className="flex w-full flex-col gap-1.5 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 text-left transition hover:border-white/10 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        <div className="flex items-center justify-between gap-2 pr-6">
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${MODE_BADGE_STYLES[session.mode]}`}>
            {session.mode}
          </span>
          <span className="text-xs text-slate-500">{formatDate(session.updatedAt)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-slate-400">
          {session.preview || 'No messages'}
        </p>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session._id) }}
        className="absolute right-3 top-3 rounded-md p-1 text-slate-600 opacity-0 transition hover:bg-white/5 hover:text-red-400 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        aria-label="Delete chat"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
