import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import Keywords from './Keywords'

const meta = {
  component: Keywords,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  decorators: [withForm],
  args: {
    name: 'skills.0.keywords',
    label: 'Technologies',
    placeholder: 'TypeScript'
  }
} satisfies Meta<typeof Keywords>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Empty: Story = { parameters: { empty: true } }
