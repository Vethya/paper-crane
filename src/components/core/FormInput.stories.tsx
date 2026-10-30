import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { FormInput } from './FormInput'

const meta = {
  title: 'Core/FormInput',
  component: FormInput,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: { onSubmit: fn() }
} satisfies Meta<typeof FormInput>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole('textbox'),
      'Reduced load time by 38%'
    )
  }
}
export const Submitted: Story = {
  play: async (context) => {
    await Filled.play!(context)
    await context.userEvent.click(context.canvas.getByRole('button'))
    await expect(context.args.onSubmit).toHaveBeenCalledWith(
      'Reduced load time by 38%'
    )
  }
}
