import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { AgentOverlayHeader } from './AgentOverlayHeader'

const meta = {
  component: AgentOverlayHeader,
  tags: ['autodocs'],
  args: { onClose: fn(), onHistoryClick: fn(), onNewChat: fn() }
} satisfies Meta<typeof AgentOverlayHeader>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Close: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close agent' }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  }
}
