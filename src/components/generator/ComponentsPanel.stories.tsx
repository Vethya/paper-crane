import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { workComponent } from '@/stories/fixtures/resume'
import { ComponentsPanel } from './ComponentsPanel'

const meta = {
  component: ComponentsPanel,
  tags: ['autodocs'],
  args: { activeType: 'work', onActiveTypeChange: fn(), onClose: fn() }
} satisfies Meta<typeof ComponentsPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Loading: Story = { parameters: { apiLoading: true } }
export const Error: Story = { parameters: { apiError: true } }
export const Populated: Story = {
  parameters: { apiData: [workComponent], a11y: { test: 'todo' } },
  play: async ({ canvas }) => {
    await expect(canvas.findByText('Northstar Labs')).resolves.toBeVisible()
  }
}
export const Sheet: Story = {
  args: { variant: 'sheet' },
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
