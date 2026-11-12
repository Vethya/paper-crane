import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { seeded } from '@/stories/seed'
import { positionEdit } from '@/stories/fixtures/agent'
import { AgentTriggerButton } from './AgentTriggerButton'

const meta = {
  component: AgentTriggerButton,
  tags: ['autodocs'],
  decorators: [seeded]
} satisfies Meta<typeof AgentTriggerButton>
export default meta
type Story = StoryObj<typeof meta>

export const SignedIn: Story = {}
export const SignedOut: Story = {
  parameters: { session: { data: null, isPending: false } }
}
export const OverlayOpen: Story = { parameters: { state: { open: true } } }
export const PendingEdits: Story = {
  parameters: { state: { edits: [positionEdit] } }
}
