'use client'

import { useAtom, useAtomValue } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  agentOpenAtom,
  agentMessagesAtom,
  agentIsStreamingAtom,
  agentModeAtom,
  agentSessionIdAtom,
  agentResumeIdAtom,
  agentHistoryOpenAtom,
  type AgentMode,
  type AgentMessage,
} from '../../../atoms/agentAtom'
import { formDataAtom } from '../../../atoms/formData'
import { authClient } from '../../../db/auth-client'
import { AgentOverlayHeader } from './AgentOverlayHeader'
import { AgentMessageList } from './AgentMessageList'
import { AgentComposer } from './AgentComposer'
import { AgentHistoryDialog } from '../AgentHistory/AgentHistoryDialog'

function buildResumeContextMessages(resumeData: object): AgentMessage[] {
  return [
    {
      id: 'ctx-resume',
      role: 'user',
      content: `Here is my current resume data in JSON format. Please use this as context for our conversation:\n\n<resume>\n${JSON.stringify(resumeData, null, 2)}\n</resume>`,
    },
    {
      id: 'ctx-ack',
      role: 'assistant',
      content: "I've reviewed your resume. How can I help you?",
    },
  ]
}

async function saveSession({
  resumeId,
  sessionId,
  mode,
  messages,
}: {
  resumeId: string
  sessionId: string | null
  mode: string
  messages: AgentMessage[]
}): Promise<string> {
  const res = await fetch('/api/agent/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId, sessionId, mode, messages }),
  })
  if (!res.ok) throw new Error('Failed to save session')
  const data = (await res.json()) as { sessionId: string }
  return data.sessionId
}

export function AgentOverlay() {
  const [open, setOpen] = useAtom(agentOpenAtom)
  const [messages, setMessages] = useAtom(agentMessagesAtom)
  const [isStreaming, setIsStreaming] = useAtom(agentIsStreamingAtom)
  const [sessionId, setSessionId] = useAtom(agentSessionIdAtom)
  const [mode, setMode] = useAtom(agentModeAtom)
  const [historyOpen, setHistoryOpen] = useAtom(agentHistoryOpenAtom)
  const resumeId = useAtomValue(agentResumeIdAtom)
  const formData = useAtomValue(formDataAtom)
  const { data: session } = authClient.useSession()
  const [isLoadingSession, setIsLoadingSession] = useState(false)

  const handleClose = useCallback(() => {
    setOpen(false)
    setMessages([])
    setSessionId(null)
    setHistoryOpen(false)
  }, [setOpen, setMessages, setSessionId, setHistoryOpen])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setHistoryOpen(false)
  }, [setMessages, setSessionId, setHistoryOpen])

  const handleSelectSession = useCallback(
    async (id: string) => {
      setHistoryOpen(false)
      setIsLoadingSession(true)
      try {
        const res = await fetch(`/api/agent/sessions/${id}`)
        if (!res.ok) throw new Error('Failed to load session')
        const data = (await res.json()) as { mode: AgentMode; messages: AgentMessage[] }
        setMessages(data.messages)
        setSessionId(id)
        setMode(data.mode)
      } catch (err) {
        console.error('[AgentOverlay] Load session error:', err)
      } finally {
        setIsLoadingSession(false)
      }
    },
    [setHistoryOpen, setMessages, setSessionId, setMode],
  )

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return

      const userMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      }

      const assistantMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      }

      const nextMessages = [...messages, userMessage]
      setMessages([...nextMessages, assistantMessage])
      setIsStreaming(true)

      // Always prepend fresh resume context — never stale, works for both new and resumed sessions
      const apiMessages = [...buildResumeContextMessages(formData ?? {}), ...nextMessages]

      let finalContent = ''

      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, mode }),
        })

        if (!res.ok || !res.body) throw new Error('Stream request failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          finalContent += decoder.decode(value, { stream: true })

          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...assistantMessage, content: finalContent }
            return updated
          })
        }
      } catch (err) {
        console.error('[AgentOverlay] Stream error:', err)
        finalContent = 'Something went wrong. Please try again.'
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...assistantMessage, content: finalContent }
          return updated
        })
      } finally {
        setIsStreaming(false)

        // Auto-save after each completed response
        if (resumeId) {
          const finalMessages = [...nextMessages, { ...assistantMessage, content: finalContent }]
          try {
            const savedId = await saveSession({ resumeId, sessionId, mode, messages: finalMessages })
            setSessionId(savedId)
          } catch (err) {
            console.error('[AgentOverlay] Session save error:', err)
          }
        }
      }
    },
    [isStreaming, messages, mode, formData, resumeId, sessionId, setMessages, setIsStreaming, setSessionId],
  )

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
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col">
            <AgentOverlayHeader onClose={handleClose} onHistoryClick={() => setHistoryOpen(true)} onNewChat={handleNewChat} />
            <div className="mx-4 border-b border-slate-700/50" />

            {!session ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <Sparkles className="h-10 w-10 text-blue-400/60" />
                <p className="text-base font-medium text-slate-200">Sign in to use the Resume Agent</p>
                <p className="text-sm text-slate-400">The AI agent is available to authenticated users only.</p>
                <a
                  href="/login"
                  className="mt-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  Sign in
                </a>
              </div>
            ) : isLoadingSession ? (
              <div className="flex flex-1 flex-col gap-3 px-4 py-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-10 animate-pulse rounded-2xl bg-slate-800/60 ${i % 2 === 0 ? 'self-end w-2/3' : 'self-start w-3/4'}`}
                  />
                ))}
              </div>
            ) : (
              <AgentMessageList messages={messages} isStreaming={isStreaming} />
            )}

            <div className="mx-4 border-t border-slate-700/50" />
            {session && <AgentComposer onSend={handleSend} />}

            <AnimatePresence>
              {historyOpen && resumeId && (
                <AgentHistoryDialog
                  resumeId={resumeId}
                  onClose={() => setHistoryOpen(false)}
                  onSelect={handleSelectSession}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
