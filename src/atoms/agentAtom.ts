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
  /** Hidden messages are sent to the API but not shown in the UI (e.g. resume context) */
  hidden?: boolean
}

export const agentMessagesAtom = atom<AgentMessage[]>([])
agentMessagesAtom.debugLabel = 'agentMessagesAtom'

export const agentIsStreamingAtom = atom(false)
agentIsStreamingAtom.debugLabel = 'agentIsStreamingAtom'
