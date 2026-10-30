import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Logo } from './Logo'

const meta = {
  component: Logo,
  tags: ['autodocs']
} satisfies Meta<typeof Logo>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Compact: Story = {
  args: { scale: 0.62 },
  parameters: { a11y: { test: 'todo' } }
}
export const Large: Story = { args: { scale: 1.5 } }
