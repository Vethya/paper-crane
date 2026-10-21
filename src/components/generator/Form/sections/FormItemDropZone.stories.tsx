import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FormItemDropZone } from './FormItemDropZone'

const meta = {
  component: FormItemDropZone,
  tags: ['autodocs'],
  args: { active: true }
} satisfies Meta<typeof FormItemDropZone>
export default meta
type Story = StoryObj<typeof meta>

export const Normal: Story = {}
export const Spacious: Story = { args: { size: 'spacious' } }
export const Empty: Story = { args: { size: 'empty' } }
export const Inactive: Story = { args: { size: 'empty', active: false } }
