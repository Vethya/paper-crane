import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import { SkillsSection } from './SkillsSection'

const meta = {
  component: SkillsSection,
  tags: ['autodocs'],
  decorators: [withForm]
} satisfies Meta<typeof SkillsSection>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = { parameters: { a11y: { test: 'todo' } } }
export const Empty: Story = { parameters: { empty: true } }
