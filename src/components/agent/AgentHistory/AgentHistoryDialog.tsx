'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { AgentHistoryItem, type SessionPreview } from './AgentHistoryItem'

interface AgentHistoryDialogProps {
  resumeId: string
  onClose: () => void
  onSelect: (id: string) => void
}

export function AgentHistoryDialog({ resumeId, onClose, onSelect }: AgentHistoryDialogProps) {
  const [sessions, setSessions] = useState<SessionPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`/api/agent/sessions?resumeId=${resumeId}`)
        if (!res.ok) throw new Error('Failed to fetch sessions')
        const data = (await res.json()) as SessionPreview[]
        setSessions(data)
      } catch (err) {
        console.error('[AgentHistoryDialog] Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    void fetchSessions()
  }, [resumeId])

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter(
      (s) => s.preview.toLowerCase().includes(q) || s.mode.toLowerCase().includes(q),
    )
  }, [sessions, search])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingId) return
    const id = deletingId
    setDeletingId(null)
    setSessions((prev) => prev.filter((s) => s._id !== id))
    try {
      const res = await fetch(`/api/agent/sessions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete session')
    } catch (err) {
      console.error('[AgentHistoryDialog] Delete error:', err)
      // Re-fetch to restore state on failure
      const res = await fetch(`/api/agent/sessions?resumeId=${resumeId}`)
      if (res.ok) setSessions((await res.json()) as SessionPreview[])
    }
  }, [deletingId, resumeId])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="flex h-[520px] w-full max-w-[460px] flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <span className="text-sm font-medium text-slate-200">Chat history</span>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              aria-label="Close history"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-4 border-b border-slate-700/50" />

          {/* Search */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search chats…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-24 items-center justify-center">
                <p className="text-sm text-slate-500">
                  {search ? 'No chats match your search' : 'No saved chats yet'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((s) => (
                  <AgentHistoryItem
                    key={s._id}
                    session={s}
                    onSelect={onSelect}
                    onDelete={setDeletingId}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Delete confirmation dialog — portalled to body to escape framer-motion stacking context */}
      {mounted && createPortal(
        <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.1 }}
              className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-100">Delete chat?</span>
                <span className="text-sm text-slate-500">This can't be undone.</span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
