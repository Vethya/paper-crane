import type { Decorator } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { useHydrateAtoms } from 'jotai/utils'
import {
  agentModeAtom,
  agentIsStreamingAtom,
  type AgentMode
} from '@/atoms/agentAtom'
import { isLoadingResumeAtom, resumeAtom } from '@/atoms/resume'
import { formDataAtom } from '@/atoms/formData'
import { resume } from './fixtures/resume'

function Seed({
  children,
  state
}: {
  children: ReactNode
  state: {
    mode?: AgentMode
    streaming?: boolean
    loading?: boolean
    pdf?: boolean
  }
}) {
  useHydrateAtoms([
    [agentModeAtom, state.mode ?? 'Chat'],
    [agentIsStreamingAtom, !!state.streaming],
    [isLoadingResumeAtom, !!state.loading],
    [formDataAtom, resume],
    [
      resumeAtom,
      {
        url: state.pdf ? '/blank.pdf?resume-fixture' : '',
        isLoading: false,
        isError: false
      }
    ]
  ] as const)
  return children
}

export const seeded: Decorator = (Story, { parameters }) => (
  <Seed state={parameters.state ?? {}}>
    <Story />
  </Seed>
)
