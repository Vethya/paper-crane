import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FormFixture } from '@/stories/fixtures/FormFixture'
import { Input, Textarea, StyledInput, StyledTextarea } from './Input'

const meta = {
  title: 'Core/Input',
  component: Input,
  tags: ['autodocs'],
  args: { name: 'basics.name', 'aria-label': 'Full name' },
  decorators: [
    (Story) => (
      <FormFixture>
        <Story />
      </FormFixture>
    )
  ]
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Disabled: Story = { args: { disabled: true } }
export const Invalid: Story = { args: { 'aria-invalid': true } }
export const Empty: Story = {
  render: () => <StyledInput aria-label="Full name" placeholder="Jordan Diaz" />
}
export const Multiline: Story = {
  render: () => <Textarea name="work.0.highlights.0" aria-label="Achievement" />
}
export const LongContent: Story = {
  render: () => (
    <StyledTextarea
      aria-label="Achievement"
      defaultValue={'Led frontend platform improvements across six product teams. '.repeat(
        8
      )}
    />
  )
}
