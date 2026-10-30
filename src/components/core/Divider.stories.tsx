import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Divider } from './Divider'

const meta = {
  component: Divider,
  tags: ['autodocs']
} satisfies Meta<typeof Divider>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Subtle: Story = { args: { className: 'h-px bg-app-border' } }
