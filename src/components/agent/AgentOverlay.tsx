'use client'

import { useAtom } from 'jotai'
import { X, History, Send, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { agentOpenAtom } from '../../atoms/agentAtom'

export function AgentOverlay() {
  const [open, setOpen] = useAtom(agentOpenAtom)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60">
            <History className="h-4 w-4" />
            History
          </button>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            aria-label="Close agent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-4 border-b border-slate-700/50" />

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Messages will be rendered here in Phase 2 */}
        </div>

        <div className="mx-4 border-t border-slate-700/50" />
        {/* Composer */}
        <div className="shrink-0 p-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 pb-3 pt-4">
            {/* Textarea */}
            <textarea
              rows={1}
              placeholder="Ask anything about your resume…"
              className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              style={{ maxHeight: '12rem' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${el.scrollHeight}px`
              }}
            />

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              {/* Mode dropdown */}
              <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60">
                Chat
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Send button */}
              <button className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-600">
            Shift+Tab to cycle modes
          </p>
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
