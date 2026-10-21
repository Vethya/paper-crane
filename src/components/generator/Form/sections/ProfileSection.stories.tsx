import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import { ProfileSection } from './ProfileSection'

const meta = {
  component: ProfileSection,
  tags: ['autodocs'],
  decorators: [withForm]
} satisfies Meta<typeof ProfileSection>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Empty: Story = { parameters: { empty: true } }
