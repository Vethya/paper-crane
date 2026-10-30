import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, waitFor, within } from 'storybook/test'
import { workComponent } from '@/stories/fixtures/resume'
import { ComponentEditorDialog } from './ComponentEditorDialog'

const meta = {
  component: ComponentEditorDialog,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: {
    open: true,
    type: 'work',
    onOpenChange: fn(),
    onSave: fn(async () => {})
  },
  play: async ({ parameters, userEvent }) => {
    if (!parameters.save) return
    const dialog = within(document.body)
    await userEvent.click(dialog.getByRole('button', { name: 'Save' }))
    if (parameters.error)
      await waitFor(() =>
        expect(dialog.getByText(parameters.error)).toBeVisible()
      )
  }
} satisfies Meta<typeof ComponentEditorDialog>
export default meta
type Story = StoryObj<typeof meta>

export const New: Story = {}
export const Edit: Story = { args: { component: workComponent } }
export const Invalid: Story = {
  parameters: { save: true, error: 'Work Experience requires Company name' }
}
export const Loading: Story = {
  args: {
    component: workComponent,
    onSave: fn(() => new Promise<void>(() => {}))
  },
  parameters: { save: true }
}
export const Error: Story = {
  args: {
    component: workComponent,
    onSave: fn(async () => {
      throw new globalThis.Error('Service unavailable')
    })
  },
  parameters: { save: true, error: 'Service unavailable' }
}
