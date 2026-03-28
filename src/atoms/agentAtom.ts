import { atom } from 'jotai'

export const agentOpenAtom = atom(false)
agentOpenAtom.debugLabel = 'agentOpenAtom'

export type AgentMode = 'Chat' | 'Feedback' | 'Tailoring'
export const AGENT_MODES: AgentMode[] = ['Chat', 'Feedback', 'Tailoring']

export const agentModeAtom = atom<AgentMode>('Chat')
agentModeAtom.debugLabel = 'agentModeAtom'
