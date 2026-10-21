import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FormFixture } from '@/stories/fixtures/FormFixture'
import { LabeledInput } from './LabeledInput'

const meta = {
  title: 'Core/LabeledInput',
  component: LabeledInput,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: { name: 'basics.name', label: 'Full name' },
  decorators: [
    (Story) => (
      <FormFixture>
        <Story />
      </FormFixture>
    )
  ]
} satisfies Meta<typeof LabeledInput>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Disabled: Story = { args: { disabled: true } }
export const Invalid: Story = { args: { invalid: true } }
export const Multiline: Story = {
  args: { name: 'work.0.highlights.0', label: 'Achievement', multiline: true }
}
