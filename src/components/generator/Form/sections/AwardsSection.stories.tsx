import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import { AwardSection } from './AwardsSection'

const meta = {
  component: AwardSection,
  tags: ['autodocs'],
  decorators: [withForm]
} satisfies Meta<typeof AwardSection>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
export const Empty: Story = { parameters: { empty: true } }
