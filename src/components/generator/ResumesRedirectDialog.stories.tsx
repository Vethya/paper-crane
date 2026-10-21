import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ResumesRedirectDialog } from './ResumesRedirectDialog'

const meta = {
  component: ResumesRedirectDialog,
  tags: ['autodocs'],
  args: { open: true }
} satisfies Meta<typeof ResumesRedirectDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const Closed: Story = { args: { open: false } }
