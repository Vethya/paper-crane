import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  args: { children: 'Resume title', htmlFor: 'label-title' },
  render: (args) => (
    <div>
      <Input
        id="label-title"
        className="peer"
        disabled={args['aria-disabled'] === true}
      />
      <Label {...args} />
    </div>
  )
} satisfies Meta<typeof Label>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { 'aria-disabled': true } }
