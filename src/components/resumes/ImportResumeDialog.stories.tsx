import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { openDialog } from '@/stories/openDialog'
import { resume } from '@/stories/fixtures/resume'
import { ImportResumeDialog } from './ImportResumeDialog'

const meta = {
  component: ImportResumeDialog,
  tags: ['autodocs'],
  args: { children: <button>Import resume</button> },
  play: async (context) => {
    await openDialog(context)
    if (!context.parameters.upload) return
    const dialog = within(document.body)
    const file = new File(
      [context.parameters.invalid ? '{' : JSON.stringify(resume)],
      'resume.json',
      { type: 'application/json' }
    )
    await context.userEvent.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      file
    )
    await expect(
      dialog.findByText(
        context.parameters.invalid ? 'Invalid JSON file.' : 'resume.json'
      )
    ).resolves.toBeVisible()
    if (context.parameters.apiLoading)
      await context.userEvent.click(
        dialog.getByRole('button', { name: 'Import' })
      )
  }
} satisfies Meta<typeof ImportResumeDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Loaded: Story = {
  parameters: { upload: true, a11y: { test: 'todo' } }
}
export const Invalid: Story = { parameters: { upload: true, invalid: true } }
export const Loading: Story = { parameters: { upload: true, apiLoading: true } }
