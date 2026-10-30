import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { AgentMessageList } from './AgentMessageList'

const meta = {
  component: AgentMessageList,
  tags: ['autodocs'],
  args: { messages: [], isStreaming: false, onRetry: fn() }
} satisfies Meta<typeof AgentMessageList>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { parameters: { a11y: { test: 'todo' } } }
export const Conversation: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'user',
        content: 'Tailor my resume for a senior frontend role.'
      },
      {
        id: '2',
        role: 'assistant',
        content:
          '## Suggested focus\n\n- **React** platform work\n- Measurable impact\n\n' +
          'Led improvements across six product teams. '.repeat(12)
      }
    ]
  }
}
export const Streaming: Story = {
  args: {
    isStreaming: true,
    messages: [{ id: '3', role: 'assistant', content: '' }]
  }
}
export const Error: Story = {
  args: {
    messages: [
      {
        id: '4',
        role: 'assistant',
        content: 'Unable to complete the request. Please retry.',
        error: true
      }
    ]
  }
}
