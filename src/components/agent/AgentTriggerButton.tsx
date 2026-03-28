'use client'

import { useAtom } from 'jotai'
import { Sparkles } from 'lucide-react'
import { agentOpenAtom } from '../../atoms/agentAtom'

export function AgentTriggerButton() {
  const [open, setOpen] = useAtom(agentOpenAtom)

  if (open) return null

  return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-blue-500/40 bg-slate-900/90 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_-8px_rgba(37,99,235,0.5)] backdrop-blur-sm transition hover:border-blue-400/60 hover:bg-slate-800/90 hover:shadow-[0_8px_32px_-4px_rgba(37,99,235,0.65)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
    >
      <Sparkles className="h-4 w-4 text-blue-400" />
      Resume Agent
    </button>
  )
}
