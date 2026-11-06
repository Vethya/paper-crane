import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, fireEvent } from 'storybook/test'
import { seeded } from '@/stories/seed'
import { AgentComposer } from './AgentComposer'

const meta = {
  component: AgentComposer,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: { onSend: fn() },
  decorators: [seeded]
} satisfies Meta<typeof AgentComposer>
export default meta
type Story = StoryObj<typeof meta>

export const Chat: Story = {}
export const Feedback: Story = { parameters: { state: { mode: 'Feedback' } } }
export const Tailoring: Story = { parameters: { state: { mode: 'Tailoring' } } }
export const Streaming: Story = { parameters: { state: { streaming: true } } }

export const MessageLimits: Story = {
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole('textbox', { name: 'Message' })
    const send = canvas.getByRole('button', { name: 'Send message' })
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'x'.repeat(25_600) } })
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '25,600 / 32,000 characters'
    )
    fireEvent.change(input, { target: { value: 'x'.repeat(32_001) } })
    await expect(send).toBeDisabled()
    fireEvent.keyDown(input, { key: 'Enter' })
    await expect(args.onSend).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'x'.repeat(32_000) } })
    await expect(send).toBeEnabled()
    fireEvent.change(input, { target: { value: 'Short again' } })
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  }
}
export const ResumeNearLimit: Story = {
  parameters: { state: { form: { basics: { name: 'x'.repeat(52_000) } } } }
}
export const ResumeOverLimit: Story = {
  parameters: { state: { form: { basics: { name: 'x'.repeat(64_000) } } } }
}
export const ContextNearLimit: Story = {
  parameters: {
    state: {
      messages: Array.from({ length: 4 }, (_, i) => ({
        id: String(i),
        role: i % 2 ? 'assistant' : 'user',
        content: 'x'.repeat(26_000)
      }))
    }
  }
}
export const ContextTrimmed: Story = {
  parameters: {
    state: {
      messages: Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        role: i % 2 ? 'assistant' : 'user',
        content: 'x'.repeat(26_000)
      }))
    }
  }
}
