import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { ResumeCard } from './ResumeCard'

const meta = {
  component: ResumeCard,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: {
    id: 'jordan',
    title: 'Senior Frontend Engineer',
    updatedAt: '2025-06-12T12:00:00Z',
    onDelete: fn()
  },
  beforeEach: () => {
    const original = globalThis.fetch
    globalThis.fetch = async () => new Response(null, { status: 204 })
    return () => {
      globalThis.fetch = original
    }
  }
} satisfies Meta<typeof ResumeCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Tagged: Story = { args: { tags: ['Frontend', 'Remote'] } }
export const LongTitle: Story = {
  args: {
    title:
      'Senior Frontend Platform Engineer | Design Systems and Developer Experience | Northstar Labs'
  }
}
