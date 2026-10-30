import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { seeded } from '@/stories/seed'
import {
  positionEdit,
  entryEdit,
  appendedResume,
  removeEdit
} from '@/stories/fixtures/agent'
import { AgentEditReviewBar } from './AgentEditReviewBar'

const meta = {
  component: AgentEditReviewBar,
  tags: ['autodocs'],
  decorators: [seeded],
  parameters: { state: { edits: [positionEdit] } },
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    await waitFor(() => {
      for (const element of canvasElement.querySelectorAll(
        '[style*="opacity"]'
      )) {
        expect(getComputedStyle(element).opacity).toBe('1')
      }
    })
    if (!parameters.action) return
    await userEvent.click(
      canvas.getByRole('button', { name: parameters.action })
    )
    await waitFor(() =>
      expect(canvas.queryByText(/to review/)).not.toBeInTheDocument()
    )
  }
} satisfies Meta<typeof AgentEditReviewBar>
export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {}
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
export const Empty: Story = { parameters: { state: { edits: [] } } }
export const Multiple: Story = {
  parameters: {
    state: {
      edits: [positionEdit, entryEdit, removeEdit],
      form: appendedResume,
      summary: 'Focus on frontend impact'
    }
  }
}
export const Approved: Story = { parameters: { action: 'Approve All' } }
export const Rejected: Story = { parameters: { action: 'Reject All' } }
