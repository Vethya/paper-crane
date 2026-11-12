import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { AgentHistoryItem } from './AgentHistoryItem'

const session = {
  _id: 'session-1',
  mode: 'Chat' as const,
  updatedAt: '2025-06-12T12:00:00Z',
  preview: 'Strengthen my frontend platform resume.'
}
const meta = {
  component: AgentHistoryItem,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: { session, onSelect: fn(), onDelete: fn() }
} satisfies Meta<typeof AgentHistoryItem>
export default meta
type Story = StoryObj<typeof meta>

export const Chat: Story = {}
export const Feedback: Story = {
  args: { session: { ...session, mode: 'Feedback' } }
}
export const Tailoring: Story = {
  args: { session: { ...session, mode: 'Tailoring' } }
}
export const Empty: Story = { args: { session: { ...session, preview: '' } } }
export const LongPreview: Story = {
  args: { session: { ...session, preview: session.preview.repeat(10) } }
}
