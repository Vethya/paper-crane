import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import { ProjectsSection } from './projectsSection'

const meta = {
  component: ProjectsSection,
  tags: ['autodocs'],
  decorators: [withForm]
} satisfies Meta<typeof ProjectsSection>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = { parameters: { a11y: { test: 'todo' } } }
export const Empty: Story = { parameters: { empty: true } }
