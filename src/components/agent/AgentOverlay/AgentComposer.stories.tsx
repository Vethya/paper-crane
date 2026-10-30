import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
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
