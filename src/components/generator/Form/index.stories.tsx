import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Form } from './index'

const meta = {
  title: 'Generator/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: { nextjs: { navigation: { query: { id: 'jordan' } } } }
} satisfies Meta<typeof Form>
export default meta
type Story = StoryObj<typeof meta>

export const Profile: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.findByDisplayValue('Jordan Diaz')
    ).resolves.toBeVisible()
  }
}
export const Templates: Story = { args: { activeSection: 'templates' } }
export const Education: Story = { args: { activeSection: 'education' } }
export const Work: Story = {
  args: { activeSection: 'work' },
  parameters: { a11y: { test: 'todo' } }
}
export const Skills: Story = {
  args: { activeSection: 'skills' },
  parameters: { a11y: { test: 'todo' } }
}
export const Projects: Story = { args: { activeSection: 'projects' } }
export const Awards: Story = { args: { activeSection: 'awards' } }
export const Loading: Story = { parameters: { apiLoading: true } }
