import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor, within } from 'storybook/test'
import { Toaster, toast } from './sonner'

const meta = {
  title: 'UI/Toaster',
  component: Toaster,
  tags: ['autodocs'],
  beforeEach: () => () => toast.dismiss(),
  play: async ({ parameters }) => {
    const notify = parameters.notify ?? toast
    notify('Resume updated', { duration: Infinity })
    await waitFor(() =>
      expect(within(document.body).getByText('Resume updated')).toBeVisible()
    )
  }
} satisfies Meta<typeof Toaster>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Success: Story = { parameters: { notify: toast.success } }
export const Error: Story = { parameters: { notify: toast.error } }
export const Warning: Story = { parameters: { notify: toast.warning } }
export const Info: Story = { parameters: { notify: toast.info } }
export const Loading: Story = { parameters: { notify: toast.loading } }
