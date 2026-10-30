import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { TagPicker } from './TagPicker'

const meta = {
  component: TagPicker,
  tags: ['autodocs'],
  parameters: {
    nextjs: { navigation: { query: { id: 'jordan' } } },
    a11y: { test: 'todo' }
  },
  decorators: [
    (Story) => (
      <div className="flex justify-end">
        <Story />
      </div>
    )
  ],
  play: async ({ canvas, userEvent, parameters }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }))
    await expect(
      canvas.findByText(parameters.apiData?.length ? 'Remote' : 'No tags yet')
    ).resolves.toBeVisible()
  }
} satisfies Meta<typeof TagPicker>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Populated: Story = {
  parameters: { apiData: [{ _id: 'tag-1', name: 'Remote', color: 'blue' }] }
}
