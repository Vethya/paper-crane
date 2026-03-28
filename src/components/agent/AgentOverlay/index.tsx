'use client'

import { useAtom } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import { agentOpenAtom } from '../../../atoms/agentAtom'
import { AgentOverlayHeader } from './AgentOverlayHeader'
import { AgentMessageList } from './AgentMessageList'
import { AgentComposer } from './AgentComposer'

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
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm"
        >
          <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
            <AgentOverlayHeader onClose={() => setOpen(false)} onHistoryClick={() => {}} />
            <div className="mx-4 border-b border-slate-700/50" />

            <AgentMessageList />

            <div className="mx-4 border-t border-slate-700/50" />
            <AgentComposer onSend={() => {}} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
