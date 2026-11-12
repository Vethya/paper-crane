import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { workComponent } from '@/stories/fixtures/resume'
import { ComponentCard } from './ComponentCard'

const meta = {
  component: ComponentCard,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: {
    component: workComponent,
    mode: 'library',
    onOpen: fn(),
    onEdit: fn(),
    onDelete: fn(),
    onAdd: fn()
  }
} satisfies Meta<typeof ComponentCard>
export default meta
type Story = StoryObj<typeof meta>

export const Library: Story = {}
export const Panel: Story = { args: { mode: 'panel' } }
export const Highlighted: Story = { args: { mode: 'panel', highlighted: true } }
export const Empty: Story = {
  args: { component: { ...workComponent, content: { highlights: [] } } }
}
