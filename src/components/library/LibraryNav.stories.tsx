import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LibraryNav } from './LibraryNav'

const meta = {
  component: LibraryNav,
  tags: ['autodocs'],
  parameters: { nextjs: { navigation: { pathname: '/resumes' } } }
} satisfies Meta<typeof LibraryNav>
export default meta
type Story = StoryObj<typeof meta>

export const Resumes: Story = {}
export const Components: Story = {
  parameters: { nextjs: { navigation: { pathname: '/components' } } }
}
