import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { seeded } from '@/stories/seed'
import { Sidebar, MobileNav } from './Sidebar'

const meta = {
  component: Sidebar,
  tags: ['autodocs'],
  decorators: [seeded],
  args: {
    activeSection: 'work',
    onSectionChange: fn(),
    showComponents: true,
    onComponentsToggle: fn()
  }
} satisfies Meta<typeof Sidebar>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ComponentsOpen: Story = { args: { componentsOpen: true } }
export const Loading: Story = { parameters: { state: { loading: true } } }
export const Mobile: Story = {
  render: (args) => <MobileNav {...args} />,
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
