import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { seeded } from '@/stories/seed'
import { AgentTriggerButton } from '../AgentTriggerButton'
import { useSetAtom } from 'jotai'
import { agentResumeIdAtom } from '@/atoms/agentAtom'
import { useState } from 'react'
import { messages } from '@/stories/fixtures/agent'
import { AgentOverlay } from './index'

const meta = {
  title: 'Agent/Overlay',
  component: AgentOverlay,
  tags: ['autodocs'],
  decorators: [seeded],
  parameters: { state: { open: true }, a11y: { test: 'todo' } },
  play: async ({ canvas, userEvent, parameters }) => {
    if (!parameters.send) return
    await userEvent.type(
      canvas.getByRole('textbox'),
      'Suggest improvements{enter}'
    )
    await expect(
      canvas.findByText(
        parameters.apiText ?? 'Something went wrong. Please try again.'
      )
    ).resolves.toBeVisible()
  }
} satisfies Meta<typeof AgentOverlay>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
export const Conversation: Story = { parameters: { state: { messages } } }
export const Streaming: Story = {
  parameters: { state: { messages, streaming: true } }
}
export const SignedOut: Story = {
  parameters: {
    session: { data: null, isPending: false },
    a11y: { test: 'error' }
  }
}
export const Reply: Story = {
  parameters: {
    send: true,
    apiText: 'Emphasize measurable impact and accessible UI work.'
  }
}
export const Error: Story = { parameters: { send: true, apiError: true } }
export const LoadingSession: Story = {
  parameters: {
    apiLoading: true,
    nextjs: { navigation: { query: { chatId: 'session-1' } } }
  }
}
export const History: Story = {
  parameters: { state: { resumeId: 'jordan' } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'History' }))
    await waitFor(() =>
      expect(canvas.getByText('No saved chats yet')).toBeVisible()
    )
  }
}

export const CancelChat: Story = {
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let pending: AbortSignal | undefined
    let finish: (response: Response) => void = () => {}
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/chat') return original(input, init)
      pending = init?.signal ?? undefined
      return new Promise<Response>((resolve) => {
        finish = resolve
      })
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'Old question{enter}')
      await waitFor(() => expect(pending).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: 'New chat' }))
      await expect(pending?.aborted).toBe(true)
      finish(new Response('Late reply from old chat'))
      globalThis.fetch = async (input, init) =>
        String(input) === '/api/agent/chat'
          ? new Response('Reply in new chat')
          : original(input, init)
      await userEvent.type(canvas.getByRole('textbox'), 'New question{enter}')
      await expect(
        canvas.findByText('Reply in new chat')
      ).resolves.toBeVisible()
      await expect(
        canvas.queryByText('Late reply from old chat')
      ).not.toBeInTheDocument()
      await expect(
        canvas.queryByText('Something went wrong. Please try again.')
      ).not.toBeInTheDocument()
    } finally {
      globalThis.fetch = original
    }
  }
}

export const CancelTailoring: Story = {
  parameters: { state: { open: true, mode: 'Tailoring' } },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let pending: AbortSignal | undefined
    let finish: (response: Response) => void = () => {}
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/edit') return original(input, init)
      pending = init?.signal ?? undefined
      return new Promise<Response>((resolve) => {
        finish = resolve
      })
    }
    try {
      await userEvent.type(
        canvas.getByRole('textbox'),
        'Tailor the resume{enter}'
      )
      await waitFor(() => expect(pending).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: 'New chat' }))
      await expect(pending?.aborted).toBe(true)
      finish(
        Response.json({
          summary: 'Old tailoring',
          edits: [
            {
              type: 'set',
              fieldPath: 'basics.name',
              newValue: 'Stale edit',
              reason: 'late'
            }
          ]
        })
      )
      // A stale result must not close the replacement overlay or show its summary.
      await userEvent.type(canvas.getByRole('textbox'), 'A fresh question')
      await expect(canvas.getByRole('textbox')).toHaveValue('A fresh question')
      await expect(canvas.queryByText(/Old tailoring/)).not.toBeInTheDocument()
    } finally {
      globalThis.fetch = original
    }
  }
}

export const ContinueReplyOnModeChange: Story = {
  parameters: { state: { open: true, resumeId: '64b7f0c2a1b2c3d4e5f60718' } },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let pending: AbortSignal | undefined
    let finish: (response: Response) => void = () => {}
    let savedMessages: Array<{ role: string; content: string }> | undefined
    let chatCalls = 0
    globalThis.fetch = async (input, init) => {
      if (String(input) === '/api/agent/chat') {
        if (++chatCalls > 1) return new Response('Feedback after cancellation')
        pending = init?.signal ?? undefined
        return new Promise<Response>((resolve) => {
          finish = resolve
        })
      }
      if (String(input) === '/api/agent/sessions' && init?.method === 'POST') {
        savedMessages = JSON.parse(String(init.body)).messages
        return Response.json({ sessionId: '64b7f0c2a1b2c3d4e5f60719' })
      }
      return original(input, init)
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'First question{enter}')
      await waitFor(() => expect(pending).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: /Chat/ }))
      await userEvent.click(canvas.getByRole('button', { name: 'Feedback' }))
      await expect(pending?.aborted).toBe(false)
      finish(new Response('Original chat reply'))
      await expect(
        canvas.findByText('Original chat reply')
      ).resolves.toBeVisible()
      await userEvent.type(
        canvas.getByRole('textbox'),
        'Second question{enter}'
      )
      await expect(
        canvas.findByText('Feedback after cancellation')
      ).resolves.toBeVisible()
      await waitFor(() => expect(savedMessages).toBeDefined())
      await expect(
        savedMessages?.every((message) => message.content.trim().length > 0)
      ).toBe(true)
      await expect(
        savedMessages?.filter((message) => message.role === 'assistant')
      ).toEqual([
        expect.objectContaining({ content: 'Original chat reply' }),
        expect.objectContaining({ content: 'Feedback after cancellation' })
      ])
      await expect(
        canvas.queryByText('Late cancelled reply')
      ).not.toBeInTheDocument()
    } finally {
      globalThis.fetch = original
    }
  }
}

export const ReopenWhileStreaming: Story = {
  render: () => (
    <>
      <AgentTriggerButton />
      <AgentOverlay />
    </>
  ),
  parameters: {
    state: { open: true, resumeId: '64b7f0c2a1b2c3d4e5f60718', messages },
    // Seeded messages keep the initial chatId from triggering a restore.
    nextjs: { navigation: { query: { chatId: 'old-link' } } }
  },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let pending: AbortSignal | undefined
    let stream: ReadableStreamDefaultController<Uint8Array> | undefined
    let reads = 0
    let saves = 0
    let finishSave: (response: Response) => void = () => {}
    globalThis.fetch = async (input, init) => {
      if (String(input) === '/api/agent/chat') {
        pending = init?.signal ?? undefined
        return new Response(
          new ReadableStream<Uint8Array>({
            start(c) {
              stream = c
            }
          })
        )
      }
      if (String(input).startsWith('/api/agent/sessions/') && !init?.method)
        reads++
      if (String(input) === '/api/agent/sessions' && init?.method === 'POST') {
        saves++
        return new Promise<Response>((resolve) => {
          finishSave = resolve
        })
      }
      return original(input, init)
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'Keep working{enter}')
      await waitFor(() => expect(stream).toBeDefined())
      stream!.enqueue(new TextEncoder().encode('First part'))
      await expect(canvas.findByText('First part')).resolves.toBeVisible()
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Resume Agent' })
      )
      await expect(pending?.aborted).toBe(false)
      await expect(canvas.getByText('First part')).toBeVisible()
      stream!.enqueue(new TextEncoder().encode(' and final part'))
      stream!.close()
      await expect(
        canvas.findByText('First part and final part')
      ).resolves.toBeVisible()
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Resume Agent' })
      )
      await expect(canvas.getByText('First part and final part')).toBeVisible()
      finishSave(Response.json({ sessionId: '64b7f0c2a1b2c3d4e5f60719' }))
      await userEvent.type(canvas.getByRole('textbox'), 'Unsent draft')
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Resume Agent' })
      )
      await expect(canvas.getByRole('textbox')).toHaveValue('Unsent draft')
      await expect(reads).toBe(0)
      await expect(saves).toBe(1)
    } finally {
      globalThis.fetch = original
    }
  }
}

function LifecycleHarness() {
  const [mounted, setMounted] = useState(true)
  const setResume = useSetAtom(agentResumeIdAtom)
  return (
    <>
      <button onClick={() => setResume('other-resume')}>Switch resume</button>
      <button onClick={() => setMounted(false)}>Leave generator</button>
      {mounted && <AgentOverlay />}
    </>
  )
}
export const CancelOnResumeSwitch: Story = {
  render: () => <LifecycleHarness />,
  parameters: { state: { open: true, resumeId: 'first-resume' } },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let pending: AbortSignal | undefined
    let finish: (response: Response) => void = () => {}
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/edit') return original(input, init)
      pending = init?.signal ?? undefined
      return new Promise<Response>((resolve) => {
        finish = resolve
      })
    }
    try {
      await userEvent.click(canvas.getByRole('button', { name: /Chat/ }))
      await userEvent.click(canvas.getByRole('button', { name: 'Tailoring' }))
      await userEvent.type(
        canvas.getByRole('textbox'),
        'Tailor old resume{enter}'
      )
      await waitFor(() => expect(pending).toBeDefined())
      // Harness controls represent navigation outside the fullscreen overlay.
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await userEvent.click(
        canvas.getByRole('button', { name: 'Switch resume' })
      )
      await expect(pending?.aborted).toBe(true)
      finish(
        Response.json({
          summary: 'Stale edit',
          edits: [
            {
              type: 'set',
              fieldPath: 'basics.name',
              newValue: 'Wrong resume',
              reason: 'late'
            }
          ]
        })
      )
      await expect(canvas.queryByText(/Stale edit/)).not.toBeInTheDocument()
    } finally {
      globalThis.fetch = original
    }
  }
}

export const CancelOnLeaveGenerator: Story = {
  render: () => <LifecycleHarness />,
  parameters: { state: { open: true, resumeId: 'first-resume' } },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let pending: AbortSignal | undefined
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/chat') return original(input, init)
      pending = init?.signal ?? undefined
      return new Promise<Response>(() => {})
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'Still working{enter}')
      await waitFor(() => expect(pending).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await expect(pending?.aborted).toBe(false)
      await userEvent.click(
        canvas.getByRole('button', { name: 'Leave generator' })
      )
      await expect(pending?.aborted).toBe(true)
    } finally {
      globalThis.fetch = original
    }
  }
}
