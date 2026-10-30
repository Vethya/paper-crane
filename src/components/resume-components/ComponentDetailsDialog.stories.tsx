import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { workComponent } from '@/stories/fixtures/resume'
import { ComponentDetailsDialog } from './ComponentDetailsDialog'

const meta = {
  component: ComponentDetailsDialog,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: {
    component: workComponent,
    mode: 'library',
    onOpenChange: fn(),
    onAdd: fn(),
    onEdit: fn(),
    onDelete: fn()
  }
} satisfies Meta<typeof ComponentDetailsDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Library: Story = {}
export const Panel: Story = { args: { mode: 'panel' } }
export const Empty: Story = {
  parameters: { a11y: { test: 'error' } },
  args: { component: { ...workComponent, content: { highlights: [] } } }
}
