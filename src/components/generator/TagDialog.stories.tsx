import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, within } from 'storybook/test'
import { TagDialog } from './TagDialog'

const meta = {
  component: TagDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    onCreated: fn(),
    onUpdated: fn(),
    onDeleted: fn()
  },
  play: async ({ parameters, userEvent }) => {
    if (parameters.apiLoading)
      await userEvent.click(
        within(document.body).getByRole('button', { name: 'Create' })
      )
  }
} satisfies Meta<typeof TagDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Create: Story = {
  args: { initialName: 'Frontend platform roles' }
}
export const Loading: Story = { ...Create, parameters: { apiLoading: true } }
export const Edit: Story = {
  args: { editTag: { _id: 'tag-1', name: 'Remote', color: 'blue' } }
}
