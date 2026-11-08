'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  agentDraftAtom,
  agentConversationResumeIdAtom,
  agentOpenAtom,
  agentMessagesAtom,
  agentIsStreamingAtom,
  agentModeAtom,
  agentSessionIdAtom,
  agentResumeIdAtom,
  agentHistoryOpenAtom,
  type AgentMode,
  type AgentMessage
} from '../../../atoms/agentAtom'
import { formDataAtom, formSetValueAtom } from '../../../atoms/formData'
import {
  agentPendingEditsAtom,
  agentEditSummaryAtom,
  agentFocusedEditIdAtom,
  type FieldEdit,
  type NewEntryEdit,
  type RemoveEntryEdit,
  type PendingEdit,
  agentReviewTargetAtom
} from '../../../atoms/agentEdits'
import { authClient } from '../../../db/auth-client'
import {
  failedReplyMessage,
  isGenerating,
  prepareAgentMessages
} from '../../../lib/agentLimits'
import { MOCK_EDIT_RESPONSE } from '../../../lib/agentMock'
import {
  getValueAtPath,
  tailoringDoneMessage,
  type ModelEdit
} from '../../../lib/agentTailoring'
import { AgentOverlayHeader } from './AgentOverlayHeader'
import { AgentMessageList } from './AgentMessageList'
import { AgentComposer } from './AgentComposer'
import { AgentHistoryDialog } from '../AgentHistory/AgentHistoryDialog'
import { AgentRequest } from '../../../lib/agentRequest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pendingReply: AgentMessage = {
  id: 'pending-reply',
  role: 'assistant',
  content: ''
}

/** A question with no saved reply means the server failed to finish it. */
function withFailedReply(messages: AgentMessage[]): AgentMessage[] {
  if (messages.at(-1)?.role !== 'user') return messages
  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: failedReplyMessage,
      error: true
    }
  ]
}

async function saveSession({
  resumeId,
  sessionId,
  mode,
  messages
}: {
  resumeId: string
  sessionId: string | null
  mode: string
  messages: AgentMessage[]
}): Promise<string> {
  const res = await fetch('/api/agent/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId, sessionId, mode, messages })
  })
  if (!res.ok) throw new Error('Failed to save session')
  const data = (await res.json()) as { sessionId: string }
  return data.sessionId
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentOverlay() {
  const [open, setOpen] = useAtom(agentOpenAtom)
  const [messages, setMessages] = useAtom(agentMessagesAtom)
  const [isStreaming, setIsStreaming] = useAtom(agentIsStreamingAtom)
  const [sessionId, setSessionId] = useAtom(agentSessionIdAtom)
  const [mode, setMode] = useAtom(agentModeAtom)
  const [historyOpen, setHistoryOpen] = useAtom(agentHistoryOpenAtom)
  const resumeId = useAtomValue(agentResumeIdAtom)
  const formData = useAtomValue(formDataAtom)
  const formSetValue = useAtomValue(formSetValueAtom)
  const [, setPendingEdits] = useAtom(agentPendingEditsAtom)
  const [, setEditSummary] = useAtom(agentEditSummaryAtom)
  const setReviewTarget = useSetAtom(agentReviewTargetAtom)
  const [, setFocusedEditId] = useAtom(agentFocusedEditIdAtom)
  const { data: session } = authClient.useSession()
  const [isLoadingSession, setIsLoadingSession] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const chatIdParam = searchParams.get('chatId')
  const setDraft = useSetAtom(agentDraftAtom)
  const [conversationResumeId, setConversationResumeId] = useAtom(
    agentConversationResumeIdAtom
  )
  const restoredChatId = useRef<string | null>(null)
  const requests = useRef(new AgentRequest())
  const detachRequest = useCallback(() => {
    requests.current.detach()
    setMessages((prev) =>
      prev.filter(
        (message) => message.role !== 'assistant' || message.content.trim()
      )
    )
    setIsStreaming(false)
    setIsLoadingSession(false)
  }, [setIsStreaming, setMessages])
  useEffect(
    () => () => {
      detachRequest()
      restoredChatId.current = null
    },
    [detachRequest, resumeId]
  )
  useEffect(() => {
    if (conversationResumeId === resumeId) return
    detachRequest()
    setMessages([])
    setSessionId(null)
    setDraft('')
    setConversationResumeId(resumeId)
    // Do not restore a link that still points at the previous resume's chat.
    if (conversationResumeId !== null && chatIdParam === sessionId) {
      restoredChatId.current = chatIdParam
      const params = new URLSearchParams(searchParams.toString())
      params.delete('chatId')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [
    conversationResumeId,
    resumeId,
    detachRequest,
    setMessages,
    setSessionId,
    setDraft,
    setConversationResumeId,
    chatIdParam,
    sessionId,
    searchParams,
    pathname,
    router
  ])

  const handleClose = useCallback(() => {
    setOpen(false)
    setHistoryOpen(false)
  }, [setOpen, setHistoryOpen])

  const handleNewChat = useCallback(() => {
    detachRequest()
    restoredChatId.current = chatIdParam
    setDraft('')
    setMessages([])
    setSessionId(null)
    setHistoryOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('chatId')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [
    detachRequest,
    chatIdParam,
    setDraft,
    setMessages,
    setSessionId,
    setHistoryOpen,
    searchParams,
    pathname,
    router
  ])

  const handleSelectSession = useCallback(
    async (id: string) => {
      detachRequest()
      restoredChatId.current = id
      setDraft('')
      const token = requests.current.begin()
      setHistoryOpen(false)
      setIsLoadingSession(true)
      const load = async () => {
        const res = await fetch(`/api/agent/sessions/${id}`)
        if (!res.ok) throw new Error('Failed to load session')
        return (await res.json()) as {
          mode: AgentMode
          messages: AgentMessage[]
          generatingSince?: string
        }
      }
      try {
        let data = await load()
        if (!requests.current.isCurrent(token)) return
        setSessionId(id)
        setMode(data.mode)
        // The server is still finishing a reply from earlier: wait for it.
        while (isGenerating(data.generatingSince)) {
          setMessages([...data.messages, pendingReply])
          setIsStreaming(true)
          setIsLoadingSession(false)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          if (!requests.current.isCurrent(token)) return
          data = await load()
          if (!requests.current.isCurrent(token)) return
        }
        setIsStreaming(false)
        setMessages(withFailedReply(data.messages))
      } catch (err) {
        if (requests.current.isCurrent(token))
          console.error('[AgentOverlay] Load session error:', err)
      } finally {
        if (requests.current.isCurrent(token)) setIsLoadingSession(false)
      }
    },
    [
      detachRequest,
      setDraft,
      setHistoryOpen,
      setMessages,
      setIsStreaming,
      setSessionId,
      setMode
    ]
  )

  // Auto-open overlay on mount if chatId is present in URL
  useEffect(() => {
    if (chatIdParam) setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore a deep link once. Reopening uses the current in-memory conversation.
  useEffect(() => {
    if (
      !open ||
      !chatIdParam ||
      sessionId ||
      messages.length ||
      isStreaming ||
      isLoadingSession ||
      restoredChatId.current === chatIdParam
    )
      return
    restoredChatId.current = chatIdParam
    handleSelectSession(chatIdParam)
  }, [
    open,
    chatIdParam,
    sessionId,
    messages.length,
    isStreaming,
    isLoadingSession,
    handleSelectSession
  ])

  // Sync sessionId → URL
  useEffect(() => {
    if (!sessionId) return
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('chatId') === sessionId) return
    params.set('chatId', sessionId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [sessionId, pathname, router, searchParams])

  // ---------------------------------------------------------------------------
  // Chat send (existing streaming flow — Chat & Feedback modes)
  // ---------------------------------------------------------------------------

  const handleChatSend = useCallback(
    async (text: string, baseMessages?: AgentMessage[]) => {
      const token = requests.current.begin()
      const userMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text
      }
      const assistantMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: ''
      }

      const nextMessages = [...(baseMessages ?? messages), userMessage]
      setMessages([...nextMessages, assistantMessage])
      setIsStreaming(true)

      const { messages: apiMessages } = prepareAgentMessages(
        formData ?? {},
        nextMessages
      )
      let finalContent = ''

      try {
        // Save the question first. The server then saves the reply itself,
        // so it survives switching chats, switching resumes or leaving.
        const savedId = resumeId
          ? await saveSession({
              resumeId,
              sessionId,
              mode,
              messages: nextMessages
            })
          : null
        if (savedId && requests.current.isCurrent(token)) setSessionId(savedId)
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            mode,
            resumeData: formData ?? {},
            ...(savedId && {
              sessionId: savedId,
              replyId: assistantMessage.id
            })
          })
        })

        if (!res.ok)
          throw new Error(
            (await res.json()).error ??
              'Something went wrong. Please try again.'
          )
        if (!res.body) throw new Error('Stream request failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          // Stop reading only. The server keeps generating and saves the reply.
          if (!requests.current.isCurrent(token)) return void reader.cancel()
          if (done) break
          finalContent += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...assistantMessage,
              content: finalContent
            }
            return updated
          })
        }
      } catch (err) {
        if (!requests.current.isCurrent(token)) return
        console.error('[AgentOverlay] Stream error:', err)
        finalContent =
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.'
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...assistantMessage,
            content: finalContent,
            error: true
          }
          return updated
        })
      } finally {
        if (requests.current.isCurrent(token)) setIsStreaming(false)
      }
    },
    [
      messages,
      mode,
      formData,
      resumeId,
      sessionId,
      setMessages,
      setIsStreaming,
      setSessionId
    ]
  )

  // ---------------------------------------------------------------------------
  // Tailoring edit send (structured output flow)
  // ---------------------------------------------------------------------------

  const handleEditSend = useCallback(
    async (text: string, baseMessages?: AgentMessage[]) => {
      const token = requests.current.begin()
      const userMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text
      }
      const thinkingMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Tailoring your resume…'
      }

      const nextMessages = [...(baseMessages ?? messages), userMessage]
      setMessages([...nextMessages, thinkingMessage])
      setIsStreaming(true)

      // Snapshot formData before applying any edits
      const snapshot = formData ?? {}

      try {
        const isMock = process.env.NEXT_PUBLIC_AGENT_MOCK === 'true'

        // In mock mode skip the real API call entirely — no tokens spent
        // Save the question first. The server saves the result for review.
        const savedId = resumeId
          ? await saveSession({
              resumeId,
              sessionId,
              mode,
              messages: nextMessages
            })
          : null
        if (savedId && requests.current.isCurrent(token)) setSessionId(savedId)
        let data: { summary: string; edits: ModelEdit[] }
        if (isMock) {
          await new Promise((r) => setTimeout(r, 800)) // simulate network delay
          data = MOCK_EDIT_RESPONSE
        } else {
          const res = await fetch('/api/agent/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: prepareAgentMessages(snapshot, nextMessages).messages,
              resumeData: snapshot,
              ...(savedId && {
                sessionId: savedId,
                replyId: thinkingMessage.id
              })
            })
          })
          if (!res.ok)
            throw new Error(
              (await res.json()).error ??
                'Something went wrong. Please try again.'
            )
          data = (await res.json()) as typeof data
        }

        if (!requests.current.isCurrent(token)) return
        const pendingEdits: PendingEdit[] = []

        // Track the in-progress arrays so successive appends to the same path stack correctly
        const latestArrays: Record<string, unknown[]> = {}

        const getLatestArray = (arrayPath: string): unknown[] => {
          if (arrayPath in latestArrays) return latestArrays[arrayPath]
          return (
            ((snapshot as Record<string, unknown>)[arrayPath] as unknown[]) ??
            []
          )
        }

        for (const edit of data.edits) {
          if (edit.type === 'set') {
            const originalValue = getValueAtPath(snapshot, edit.fieldPath)
            const fieldEdit: FieldEdit = {
              id: crypto.randomUUID(),
              type: 'set',
              fieldPath: edit.fieldPath,
              originalValue,
              newValue: edit.newValue,
              reason: edit.reason,
              status: 'pending'
            }
            pendingEdits.push(fieldEdit)

            // Apply immediately — user approves/rejects afterward
            if (formSetValue && typeof edit.newValue === 'string') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formSetValue(edit.fieldPath as any, edit.newValue, {
                shouldDirty: true,
                shouldValidate: true
              })
            }
            // Array values (keywords) are handled by Keywords.tsx via useEffect when pendingEdits updates
          } else if (edit.type === 'remove') {
            const arrayPath = edit.arrayPath as RemoveEntryEdit['arrayPath']
            const currentArray = getLatestArray(arrayPath)
            const entry = (currentArray[edit.index] ?? {}) as Record<
              string,
              unknown
            >
            const removeEdit: RemoveEntryEdit = {
              id: crypto.randomUUID(),
              type: 'remove',
              arrayPath,
              entryIndex: edit.index,
              entry,
              reason: edit.reason,
              status: 'pending'
            }
            pendingEdits.push(removeEdit)
            // Do NOT modify the form — entry stays visible until user confirms removal
          } else if (edit.type === 'append' || edit.type === 'appendSkill') {
            const arrayPath: NewEntryEdit['arrayPath'] =
              edit.type === 'appendSkill'
                ? 'skills'
                : (edit.arrayPath as NewEntryEdit['arrayPath'])
            const entry: Record<string, unknown> =
              edit.type === 'appendSkill'
                ? { name: edit.name, keywords: edit.keywords }
                : edit.entry
            const editId = crypto.randomUUID()
            // Stamp entry so we can find it by identity, not index
            entry._agentEditId = editId

            const currentLatest = getLatestArray(arrayPath)
            const entryIndex = currentLatest.length
            const newArray = [...currentLatest, entry]
            latestArrays[arrayPath] = newArray

            const newEntryEdit: NewEntryEdit = {
              id: editId,
              type: 'append',
              arrayPath,
              entryIndex,
              entry,
              reason: edit.reason,
              status: 'pending'
            }
            pendingEdits.push(newEntryEdit)

            // Apply immediately — append the new entry to the form
            if (formSetValue) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formSetValue(arrayPath as any, newArray as any, {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          }
        }

        // Update state — Keywords.tsx effects will fire once these atoms are set
        setPendingEdits(pendingEdits)
        setEditSummary(data.summary)
        // Focus first edit so AgentFieldFocuser navigates to it immediately
        setFocusedEditId(pendingEdits[0]?.id ?? null)

        const doneMessage: AgentMessage = {
          ...thinkingMessage,
          content: tailoringDoneMessage(data.summary)
        }
        setMessages([...nextMessages, doneMessage])

        if (savedId) {
          // Mock results never reach the server, so save them here.
          if (isMock)
            await saveSession({
              resumeId: resumeId!,
              sessionId: savedId,
              mode,
              messages: [...nextMessages, doneMessage]
            }).catch((err) =>
              console.error('[AgentOverlay] Session save error:', err)
            )
          else
            setReviewTarget({ sessionId: savedId, replyId: thinkingMessage.id })
          // Keep the completed tailoring conversation linked while reviewing edits.
          const params = new URLSearchParams(searchParams.toString())
          params.set('chatId', savedId)
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }

        // Close only the operation that applied these edits.
        if (requests.current.isCurrent(token)) handleClose()
      } catch (err) {
        if (!requests.current.isCurrent(token)) return
        console.error('[AgentOverlay] Edit error:', err)
        const errorMessage: AgentMessage = {
          ...thinkingMessage,
          content:
            err instanceof Error
              ? err.message
              : 'Something went wrong while tailoring your resume. Please try again.',
          error: true
        }
        setMessages([...nextMessages, errorMessage])
      } finally {
        if (requests.current.isCurrent(token)) setIsStreaming(false)
      }
    },
    [
      messages,
      mode,
      formData,
      formSetValue,
      resumeId,
      sessionId,
      setMessages,
      setIsStreaming,
      setSessionId,
      setPendingEdits,
      setEditSummary,
      setReviewTarget,
      setFocusedEditId,
      handleClose,
      searchParams,
      pathname,
      router
    ]
  )

  // ---------------------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    const lastUserIdx = messages.findLastIndex((m) => m.role === 'user')
    if (lastUserIdx === -1) return
    const lastUserText = messages[lastUserIdx].content
    // Remove the failed assistant message and the last user message, then resend
    const restored = messages.slice(0, lastUserIdx)
    if (mode === 'Tailoring') {
      handleEditSend(lastUserText, restored)
    } else {
      handleChatSend(lastUserText, restored)
    }
  }, [messages, mode, handleEditSend, handleChatSend])

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return
      if (mode === 'Tailoring') {
        await handleEditSend(text)
      } else {
        await handleChatSend(text)
      }
    },
    [isStreaming, mode, handleEditSend, handleChatSend]
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-app-background/85 backdrop-blur-sm"
        >
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col">
            <AgentOverlayHeader
              onClose={handleClose}
              onHistoryClick={() => setHistoryOpen(true)}
              onNewChat={handleNewChat}
            />
            <div className="mx-4 border-b border-app-border" />

            {!session ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <Sparkles className="h-10 w-10 text-slate-400" />
                <p className="text-base font-medium text-slate-200">
                  Sign in to use the Resume Agent
                </p>
                <p className="text-sm text-slate-400">
                  The AI agent is available to authenticated users only.
                </p>
                <a
                  href="/login"
                  className="mt-2 rounded-app-button border border-white/90 bg-white px-6 py-2 text-sm font-medium text-app-background transition hover:bg-app-primaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Sign in
                </a>
              </div>
            ) : isLoadingSession ? (
              <div className="flex flex-1 flex-col gap-3 px-4 py-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-10 animate-pulse rounded-app-card bg-app-surfaceElevated ${i % 2 === 0 ? 'self-end w-2/3' : 'self-start w-3/4'}`}
                  />
                ))}
              </div>
            ) : (
              <AgentMessageList
                messages={messages}
                isStreaming={isStreaming}
                onRetry={handleRetry}
              />
            )}

            <div className="mx-4 border-t border-app-border" />
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
