import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { openDialog } from '@/stories/openDialog'
import { CreateResumeDialog } from './CreateResumeDialog'

const meta = {
  component: CreateResumeDialog,
  tags: ['autodocs'],
  args: { children: <button>New resume</button> },
  play: async (context) => {
    await openDialog(context)
    if (!context.parameters.submit) return
    const dialog = within(document.body)
    await context.userEvent.type(
      dialog.getByRole('textbox'),
      'Frontend Engineer'
    )
    await context.userEvent.click(
      dialog.getByRole('button', { name: 'Create' })
    )
    if (context.parameters.apiError)
      await expect(
        dialog.findByText('Failed to create resume')
      ).resolves.toBeVisible()
  }
} satisfies Meta<typeof CreateResumeDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Loading: Story = { parameters: { submit: true, apiLoading: true } }
export const Error: Story = { parameters: { submit: true, apiError: true } }
