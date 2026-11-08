import { atom } from 'jotai'

export const agentOpenAtom = atom(false)
agentOpenAtom.debugLabel = 'agentOpenAtom'

export type AgentMode = 'Chat' | 'Feedback' | 'Tailoring'
export const AGENT_MODES: AgentMode[] = ['Chat', 'Feedback', 'Tailoring']

export const agentModeAtom = atom<AgentMode>('Chat')
agentModeAtom.debugLabel = 'agentModeAtom'

export type AgentMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

export const agentMessagesAtom = atom<AgentMessage[]>([])
agentMessagesAtom.debugLabel = 'agentMessagesAtom'

export const agentIsStreamingAtom = atom(false)
agentIsStreamingAtom.debugLabel = 'agentIsStreamingAtom'

export const agentSessionIdAtom = atom<string | null>(null)
agentSessionIdAtom.debugLabel = 'agentSessionIdAtom'

export const agentResumeIdAtom = atom<string | null>(null)
agentResumeIdAtom.debugLabel = 'agentResumeIdAtom'

export const agentHistoryOpenAtom = atom(false)
agentHistoryOpenAtom.debugLabel = 'agentHistoryOpenAtom'

// Keep the draft and conversation owner while the overlay is hidden.
export const agentDraftAtom = atom('')
export const agentConversationResumeIdAtom = atom<string | null>(null)
