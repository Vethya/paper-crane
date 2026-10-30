import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { seeded } from '@/stories/seed'
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
