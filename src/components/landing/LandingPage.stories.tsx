import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { resume } from '@/stories/fixtures/resume'
import { LandingPage } from './LandingPage'

const meta = {
  component: LandingPage,
  tags: ['autodocs'],
  globals: { theme: 'light' },
  parameters: { layout: 'fullscreen', a11y: { test: 'todo' } },
  beforeEach: () => {
    localStorage.removeItem('jsonResume')
  }
} satisfies Meta<typeof LandingPage>
export default meta
type Story = StoryObj<typeof meta>

export const NewVisitor: Story = {}
export const ReturningVisitor: Story = {
  beforeEach: () => {
    localStorage.setItem('jsonResume', JSON.stringify(resume))
  }
}
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } }
}
