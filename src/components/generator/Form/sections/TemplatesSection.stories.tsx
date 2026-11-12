import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { withForm } from '@/stories/fixtures/FormFixture'
import { TemplatesSection } from './TemplatesSection'

const meta = {
  component: TemplatesSection,
  tags: ['autodocs'],
  decorators: [withForm]
} satisfies Meta<typeof TemplatesSection>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
