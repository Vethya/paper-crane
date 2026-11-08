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

const savedSession = '64b7f0c2a1b2c3d4e5f60719'
const json = (init?: RequestInit) => JSON.parse(String(init?.body))

export const NewChatIgnoresLateReply: Story = {
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let finish: ((response: Response) => void) | undefined
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/chat') return original(input, init)
      return new Promise<Response>((resolve) => {
        finish = resolve
      })
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'Old question{enter}')
      await waitFor(() => expect(finish).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: 'New chat' }))
      finish!(new Response('Late reply from old chat'))
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
    } finally {
      globalThis.fetch = original
    }
  }
}

const staleEdit = Response.json({
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

export const NewChatIgnoresLateTailoring: Story = {
  parameters: { state: { open: true, mode: 'Tailoring' } },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let finish: ((response: Response) => void) | undefined
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/edit') return original(input, init)
      return new Promise<Response>((resolve) => {
        finish = resolve
      })
    }
    try {
      await userEvent.type(
        canvas.getByRole('textbox'),
        'Tailor the resume{enter}'
      )
      await waitFor(() => expect(finish).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: 'New chat' }))
      finish!(staleEdit.clone())
      // A late result must not close the new chat or show its summary.
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
    let finish: ((response: Response) => void) | undefined
    const saves: Array<Array<{ role: string; content: string }>> = []
    const chats: Array<{ sessionId?: string; replyId?: string }> = []
    globalThis.fetch = async (input, init) => {
      if (String(input) === '/api/agent/chat') {
        chats.push(json(init))
        if (chats.length > 1) return new Response('Feedback reply')
        return new Promise<Response>((resolve) => {
          finish = resolve
        })
      }
      if (String(input) === '/api/agent/sessions' && init?.method === 'POST') {
        saves.push(json(init).messages)
        return Response.json({ sessionId: savedSession })
      }
      return original(input, init)
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'First question{enter}')
      await waitFor(() => expect(finish).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: /Chat/ }))
      await userEvent.click(canvas.getByRole('button', { name: 'Feedback' }))
      finish!(new Response('Original chat reply'))
      await expect(
        canvas.findByText('Original chat reply')
      ).resolves.toBeVisible()
      await userEvent.type(
        canvas.getByRole('textbox'),
        'Second question{enter}'
      )
      await expect(canvas.findByText('Feedback reply')).resolves.toBeVisible()
      // The question is saved first; the server saves each reply itself.
      await expect(saves.map((m) => m.map((x) => x.content))).toEqual([
        ['First question'],
        ['First question', 'Original chat reply', 'Second question']
      ])
      await expect(chats[1]).toEqual(
        expect.objectContaining({ sessionId: savedSession })
      )
      await expect(chats[1].replyId).toBeTruthy()
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
    let stream: ReadableStreamDefaultController<Uint8Array> | undefined
    let reads = 0
    let saves = 0
    globalThis.fetch = async (input, init) => {
      if (String(input) === '/api/agent/chat')
        return new Response(
          new ReadableStream<Uint8Array>({
            start(c) {
              stream = c
            }
          })
        )
      if (String(input).startsWith('/api/agent/sessions/') && !init?.method)
        reads++
      if (String(input) === '/api/agent/sessions' && init?.method === 'POST') {
        saves++
        return Response.json({ sessionId: savedSession })
      }
      return original(input, init)
    }
    const reopen = async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Resume Agent' })
      )
    }
    try {
      await userEvent.type(canvas.getByRole('textbox'), 'Keep working{enter}')
      await waitFor(() => expect(stream).toBeDefined())
      stream!.enqueue(new TextEncoder().encode('First part'))
      await expect(canvas.findByText('First part')).resolves.toBeVisible()
      await reopen()
      await expect(canvas.getByText('First part')).toBeVisible()
      stream!.enqueue(new TextEncoder().encode(' and final part'))
      stream!.close()
      await expect(
        canvas.findByText('First part and final part')
      ).resolves.toBeVisible()
      await userEvent.type(canvas.getByRole('textbox'), 'Unsent draft')
      await reopen()
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
      <button onClick={() => setMounted((m) => !m)}>Toggle generator</button>
      {mounted && <AgentOverlay />}
    </>
  )
}

export const IgnoreTailoringAfterResumeSwitch: Story = {
  render: () => <LifecycleHarness />,
  parameters: { state: { open: true, resumeId: 'first-resume' } },
  play: async ({ canvas, userEvent }) => {
    const original = globalThis.fetch
    let finish: ((response: Response) => void) | undefined
    globalThis.fetch = async (input, init) => {
      if (String(input) !== '/api/agent/edit') return original(input, init)
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
      await waitFor(() => expect(finish).toBeDefined())
      await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
      await userEvent.click(
        canvas.getByRole('button', { name: 'Switch resume' })
      )
      finish!(staleEdit.clone())
      await expect(canvas.queryByText(/Old tailoring/)).not.toBeInTheDocument()
    } finally {
      globalThis.fetch = original
    }
  }
}

const sessionPath = `/api/agent/sessions/${savedSession}`
const question = { id: 'q1', role: 'user', content: 'Long question' }
const deepLink = {
  state: { open: true, resumeId: '64b7f0c2a1b2c3d4e5f60718' },
  nextjs: { navigation: { query: { chatId: savedSession } } }
}
// Mock the session before render, since the deep link loads it on mount.
const mockSession = (respond: () => Response) => () => {
  const original = globalThis.fetch
  globalThis.fetch = async (input, init) =>
    String(input) === sessionPath ? respond() : original(input, init)
  return () => {
    globalThis.fetch = original
  }
}

let loads = 0
export const ReturnToReplyingChat: Story = {
  parameters: deepLink,
  beforeEach: () => {
    loads = 0
    // The server is still generating on the first load, then saves the reply.
    return mockSession(() =>
      Response.json(
        ++loads === 1
          ? {
              mode: 'Chat',
              messages: [question],
              generatingSince: new Date().toISOString()
            }
          : {
              mode: 'Chat',
              messages: [
                question,
                { id: 'r1', role: 'assistant', content: 'Saved by server' }
              ]
            }
      )
    )()
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText('Long question')).toBeVisible())
    await waitFor(() => expect(canvas.getByRole('textbox')).toBeDisabled())
    await waitFor(
      () => expect(canvas.getByText('Saved by server')).toBeVisible(),
      { timeout: 4000 }
    )
    await expect(canvas.getByRole('textbox')).toBeEnabled()
  }
}

export const ReturnToFailedReply: Story = {
  parameters: deepLink,
  beforeEach: mockSession(() =>
    Response.json({
      mode: 'Chat',
      messages: [question],
      generatingSince: new Date(Date.now() - 600_000).toISOString()
    })
  ),
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByText(/could not be generated/)).toBeVisible()
    )
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeVisible()
  }
}
