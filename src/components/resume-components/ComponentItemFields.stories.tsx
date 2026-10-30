import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FormFixture } from '@/stories/fixtures/FormFixture'
import { ComponentItemFields } from './ComponentItemFields'

const meta = {
  component: ComponentItemFields,
  tags: ['autodocs'],
  parameters: { a11y: { test: 'todo' } },
  args: { type: 'work', index: 0 },
  decorators: [
    (Story) => (
      <FormFixture>
        <Story />
      </FormFixture>
    )
  ]
} satisfies Meta<typeof ComponentItemFields>
export default meta
type Story = StoryObj<typeof meta>

export const Work: Story = {}
export const Education: Story = {
  args: { type: 'education' },
  parameters: { a11y: { test: 'error' } }
}
export const Skills: Story = { args: { type: 'skills' } }
export const Projects: Story = { args: { type: 'projects' } }
export const Awards: Story = {
  args: { type: 'awards' },
  parameters: { a11y: { test: 'error' } }
}
export const Invalid: Story = { args: { invalidFieldName: 'company' } }
