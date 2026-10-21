import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { seeded } from '@/stories/seed'
import { entryEdit, removeEdit, appendedResume } from '@/stories/fixtures/agent'
import { AgentEntryEditControls } from './AgentEntryEditControls'

const meta = {
  component: AgentEntryEditControls,
  tags: ['autodocs'],
  decorators: [seeded],
  args: { edit: entryEdit },
  parameters: { state: { edits: [entryEdit], form: appendedResume } }
} satisfies Meta<typeof AgentEntryEditControls>
export default meta
type Story = StoryObj<typeof meta>

export const AddedEntry: Story = {}
export const RemoveEntry: Story = {
  args: { edit: removeEdit },
  parameters: { state: { edits: [removeEdit] } }
}
export const LongReason: Story = {
  args: { edit: { ...entryEdit, reason: entryEdit.reason.repeat(8) } }
}
