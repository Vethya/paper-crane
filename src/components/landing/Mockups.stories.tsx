import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProductMockup, EditorPreview, TemplateCard } from './Mockups'

const meta = {
  component: ProductMockup,
  tags: ['autodocs'],
  globals: { theme: 'light' }
} satisfies Meta<typeof ProductMockup>
export default meta
type Story = StoryObj<typeof meta>

export const Product: Story = {}
export const Editor: Story = { render: () => <EditorPreview /> }
export const Classic: Story = { render: () => <TemplateCard name="Classic" /> }
export const Technical: Story = {
  render: () => <TemplateCard name="Technical" />
}
export const Compact: Story = { render: () => <TemplateCard name="Compact" /> }
export const Mobile: Story = {
  parameters: { a11y: { test: 'todo' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
