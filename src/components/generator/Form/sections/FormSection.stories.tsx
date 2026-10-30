import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FormSection } from './FormSection'

const meta = {
  component: FormSection,
  tags: ['autodocs'],
  args: {
    title: 'Work Experience',
    children: <p>Northstar Labs · Senior Frontend Engineer</p>
  }
} satisfies Meta<typeof FormSection>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const LongHeading: Story = {
  args: {
    title:
      'Selected experience in frontend platforms and design systems across distributed teams'
  }
}
