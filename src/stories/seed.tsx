import type { Decorator } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { useHydrateAtoms } from 'jotai/utils'
import { useForm } from 'react-hook-form'
import type { FormValues } from '@/types'
import {
  agentConversationResumeIdAtom,
  agentModeAtom,
  agentIsStreamingAtom,
  agentOpenAtom,
  agentMessagesAtom,
  agentResumeIdAtom,
  type AgentMode,
  type AgentMessage
} from '@/atoms/agentAtom'
import {
  agentPendingEditsAtom,
  agentEditSummaryAtom,
  type PendingEdit
} from '@/atoms/agentEdits'
import {
  isLoadingResumeAtom,
  loadedResumeIdAtom,
  resumeAtom
} from '@/atoms/resume'
import { formDataAtom, formSetValueAtom } from '@/atoms/formData'
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
    open?: boolean
    edits?: PendingEdit[]
    messages?: AgentMessage[]
    summary?: string
    resumeId?: string
    form?: FormValues
  }
}) {
  const form = useForm<FormValues>({ defaultValues: state.form ?? resume })
  useHydrateAtoms([
    [agentConversationResumeIdAtom, state.resumeId ?? null],
    [agentModeAtom, state.mode ?? 'Chat'],
    [agentIsStreamingAtom, !!state.streaming],
    [isLoadingResumeAtom, !!state.loading],
    [formDataAtom, state.form ?? resume],
    [formSetValueAtom, () => form.setValue],
    [agentOpenAtom, !!state.open],
    [agentMessagesAtom, state.messages ?? []],
    [agentPendingEditsAtom, state.edits ?? []],
    [agentEditSummaryAtom, state.summary ?? ''],
    [agentResumeIdAtom, state.resumeId ?? null],
    // The seeded form is this resume's loaded copy.
    [loadedResumeIdAtom, state.resumeId ?? null],
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
