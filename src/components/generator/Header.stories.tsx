import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Header } from './Header'

const meta = {
  component: Header,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { showTags: false }
} satisfies Meta<typeof Header>
export default meta
type Story = StoryObj<typeof meta>

export const SignedIn: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Jordan Diaz')).toBeVisible()
  }
}
export const SignedOut: Story = {
  parameters: { session: { data: null, isPending: false } }
}
export const Loading: Story = {
  parameters: { session: { data: null, isPending: true } }
}
export const Library: Story = {
  parameters: { nextjs: { navigation: { pathname: '/resumes' } } }
}
