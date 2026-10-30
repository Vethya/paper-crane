import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import { EducationSection } from './EducationSection'

const meta = {
  component: EducationSection,
  tags: ['autodocs'],
  decorators: [withForm]
} satisfies Meta<typeof EducationSection>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Empty: Story = { parameters: { empty: true } }
