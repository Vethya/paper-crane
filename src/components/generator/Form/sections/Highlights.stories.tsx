import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import Highlights from './Highlights'

const meta = {
  component: Highlights,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  decorators: [withForm],
  args: {
    name: 'work.0.highlights',
    label: 'Achievements',
    placeholder: 'Reduced load time by 38%'
  }
} satisfies Meta<typeof Highlights>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Empty: Story = { parameters: { empty: true } }
