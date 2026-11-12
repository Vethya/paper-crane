import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Resume title',
    placeholder: 'Senior frontend engineer'
  }
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Populated: Story = {
  args: { defaultValue: 'Jordan Diaz | Northstar Labs' }
}
export const Disabled: Story = { args: { disabled: true } }
export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'Invalid title' }
}
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'Shared resume' }
}
export const Password: Story = {
  args: { type: 'password', defaultValue: 'secret' }
}
export const File: Story = { args: { type: 'file' } }
