import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { seeded } from '@/stories/seed'
import { Preview } from './Preview'

const meta = {
  component: Preview,
  tags: ['autodocs'],
  decorators: [seeded],
  parameters: { state: { pdf: true } }
} satisfies Meta<typeof Preview>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Empty: Story = { parameters: { state: { pdf: false } } }
export const Loading: Story = { parameters: { state: { loading: true } } }
export const NextPage: Story = {
  play: async ({ canvas, userEvent }) => {
    await waitFor(() => expect(canvas.getByTitle('Next page')).toBeEnabled())
    await userEvent.click(await canvas.findByTitle('Next page'))
    await expect(canvas.findByText(/Engineer · Page 2/)).resolves.toBeVisible()
  }
}
