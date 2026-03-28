'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef } from 'react'
import { agentOpenAtom, agentMessagesAtom, agentIsStreamingAtom, agentModeAtom, type AgentMessage } from '../../../atoms/agentAtom'
import { formDataAtom } from '../../../atoms/formData'
import { AgentOverlayHeader } from './AgentOverlayHeader'
import { AgentMessageList } from './AgentMessageList'
import { AgentComposer } from './AgentComposer'

function buildResumeContextMessages(resumeData: object): AgentMessage[] {
  return [
    {
      id: 'ctx-resume',
      role: 'user',
      hidden: true,
      content: `Here is my current resume data in JSON format. Please use this as context for our conversation:\n\n<resume>\n${JSON.stringify(resumeData, null, 2)}\n</resume>`,
    },
    {
      id: 'ctx-ack',
      role: 'assistant',
      hidden: true,
      content: "I've reviewed your resume. How can I help you?",
    },
  ]
}

export function AgentOverlay() {
  const [open, setOpen] = useAtom(agentOpenAtom)
  const [messages, setMessages] = useAtom(agentMessagesAtom)
  const [isStreaming, setIsStreaming] = useAtom(agentIsStreamingAtom)
  const mode = useAtomValue(agentModeAtom)
  const formData = useAtomValue(formDataAtom)
  const contextInjectedRef = useRef(false)

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return

      let currentMessages = messages

      // Inject hidden resume context on the very first user message
      if (!contextInjectedRef.current) {
        contextInjectedRef.current = true
        const contextMessages = buildResumeContextMessages(formData ?? {})
        currentMessages = [...contextMessages]
        setMessages(contextMessages)
      }

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

      const nextMessages = [...currentMessages, userMessage]
      setMessages([...nextMessages, assistantMessage])
      setIsStreaming(true)

      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages, mode }),
        })

        if (!res.ok || !res.body) throw new Error('Stream request failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          accumulated += decoder.decode(value, { stream: true })

          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...assistantMessage, content: accumulated }
            return updated
          })
        }
      } catch (err) {
        console.error('[AgentOverlay] Stream error:', err)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...assistantMessage,
            content: 'Something went wrong. Please try again.',
          }
          return updated
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, messages, mode, formData, setMessages, setIsStreaming],
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
          <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
            <AgentOverlayHeader onClose={() => setOpen(false)} onHistoryClick={() => {}} />
            <div className="mx-4 border-b border-slate-700/50" />

            <AgentMessageList messages={messages} isStreaming={isStreaming} />

            <div className="mx-4 border-t border-slate-700/50" />
            <AgentComposer onSend={handleSend} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
