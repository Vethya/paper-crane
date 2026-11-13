import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, mocked, waitFor } from 'storybook/test'
import { getEngineDownload } from '@/lib/latex'
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
export const DownloadingEngine: Story = {
  beforeEach: () => {
    mocked(getEngineDownload).mockReturnValue({ loaded: 42, total: 100 })
  },
  play: async ({ canvas }) => {
    await expect(canvas.findByText('Hang tight!')).resolves.toBeVisible()
    await expect(canvas.getByText('42%')).toBeVisible()
  }
}
export const NextPage: Story = {
  play: async ({ canvas, userEvent }) => {
    await waitFor(() => expect(canvas.getByTitle('Next page')).toBeEnabled())
    await userEvent.click(await canvas.findByTitle('Next page'))
    await expect(canvas.findByText(/Engineer · Page 2/)).resolves.toBeVisible()
  }
}
