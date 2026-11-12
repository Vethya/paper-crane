import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import * as B from './Button'

const meta = {
  title: 'Core/Button',
  component: B.Button,
  tags: ['autodocs'],
  args: { children: 'Save resume', onClick: fn() }
} satisfies Meta<typeof B.Button>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
export const Primary: Story = {
  render: (args) => <B.PrimaryButton {...args} />
}
export const PrimaryDisabled: Story = {
  ...Primary,
  args: { disabled: true }
}
export const Mini: Story = { render: (args) => <B.MiniButton {...args} /> }
export const Add: Story = { render: (args) => <B.AddButton {...args} /> }
export const Remove: Story = { render: (args) => <B.RemoveButton {...args} /> }
export const Icon: Story = {
  render: (args) => <B.IconButton {...args} />,
  args: { children: '+', 'aria-label': 'Add work experience' }
}
