import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'
import * as D from './dialog'

const meta = {
  title: 'UI/Dialog',
  component: D.Dialog,
  tags: ['autodocs'],
  render: (args) => (
    <D.Dialog {...args}>
      <D.DialogTrigger asChild>
        <Button>Edit resume</Button>
      </D.DialogTrigger>
      <D.DialogContent>
        <D.DialogHeader>
          <D.DialogTitle>Edit resume</D.DialogTitle>
          <D.DialogDescription>
            Review your changes before saving.
          </D.DialogDescription>
        </D.DialogHeader>
        <p>Jordan Diaz · Senior frontend engineer at Northstar Labs</p>
        <D.DialogFooter>
          <D.DialogClose asChild>
            <Button>Save changes</Button>
          </D.DialogClose>
        </D.DialogFooter>
      </D.DialogContent>
    </D.Dialog>
  )
} satisfies Meta<typeof D.Dialog>
export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Open: Story = { args: { defaultOpen: true } }
