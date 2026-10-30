import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { AgentHistoryDialog } from './AgentHistoryDialog'

const meta = {
  component: AgentHistoryDialog,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: { resumeId: 'jordan', onClose: fn(), onSelect: fn() }
} satisfies Meta<typeof AgentHistoryDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Loading: Story = {
  parameters: { apiLoading: true, a11y: { test: 'error' } }
}
export const Error: Story = { parameters: { apiError: true } }
export const Populated: Story = {
  parameters: {
    apiData: [
      {
        _id: 'session-1',
        mode: 'Tailoring',
        updatedAt: '2025-06-12T12:00:00Z',
        preview: 'Tailor my resume for a senior frontend platform role.'
      }
    ]
  }
}
