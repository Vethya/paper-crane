import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, mocked, waitFor } from 'storybook/test'
import { useAtom, useAtomValue } from 'jotai'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'
import { isPreviewStaleAtom, resumeAtom } from '@/atoms/resume'
import { seeded } from '@/stories/seed'
import { removeEdit } from '@/stories/fixtures/agent'
import latex from '@/lib/latex'
import { Preview } from '../Preview'
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

export const AutoRenderControls: Story = {
  decorators: [seeded],
  beforeEach: () => {
    const previous = localStorage.getItem('autoRender')
    localStorage.setItem('autoRender', '0')
    return () => {
      if (previous === null) localStorage.removeItem('autoRender')
      else localStorage.setItem('autoRender', previous)
    }
  },
  render: () => (
    <>
      <Form />
      <Preview />
    </>
  ),
  play: async ({ canvas, userEvent }) => {
    const name = await canvas.findByDisplayValue('Jordan Diaz')
    const toggle = canvas.getByRole('switch', { name: 'Auto render' })
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await waitFor(() => expect(mocked(latex)).toHaveBeenCalled())
    mocked(latex).mockClear()
    await userEvent.type(name, ' Updated')
    await new Promise((resolve) => setTimeout(resolve, 800))
    await expect(mocked(latex)).not.toHaveBeenCalled()
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await expect(localStorage.getItem('autoRender')).toBe('1')
    await waitFor(() => expect(mocked(latex)).toHaveBeenCalledTimes(1))
    mocked(latex).mockClear()
    await userEvent.type(name, ' Again')
    await userEvent.click(toggle)
    await expect(localStorage.getItem('autoRender')).toBe('0')
    await new Promise((resolve) => setTimeout(resolve, 800))
    await expect(mocked(latex)).not.toHaveBeenCalled()
  }
}

function BuildFreshnessHarness() {
  const [edits, setEdits] = useAtom(agentPendingEditsAtom)
  const stale = useAtomValue(isPreviewStaleAtom)
  const resume = useAtomValue(resumeAtom)
  return (
    <>
      <Form />
      <button type="submit" form="resume-form" disabled={resume.isLoading}>
        Render
      </button>
      <button
        onClick={() =>
          setEdits(edits.map((edit) => ({ ...edit, status: 'rejected' })))
        }
      >
        Keep entry
      </button>
      <output aria-label="Preview freshness">
        {stale ? 'Out of date' : 'Up to date'}
      </output>
    </>
  )
}

export const PendingRemovalFreshness: Story = {
  decorators: [seeded],
  parameters: { state: { edits: [removeEdit] } },
  render: () => <BuildFreshnessHarness />,
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.findByDisplayValue('Jordan Diaz')
    ).resolves.toBeVisible()
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Render' })).toBeEnabled()
    )
    mocked(latex).mockClear()
    await userEvent.click(canvas.getByRole('button', { name: 'Render' }))
    await waitFor(() => expect(mocked(latex)).toHaveBeenCalledTimes(1))
    await expect(mocked(latex).mock.calls[0][0]).not.toContain('Northstar Labs')
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Render' })).toBeEnabled()
    )
    await expect(canvas.getByLabelText('Preview freshness')).toHaveTextContent(
      'Up to date'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Keep entry' }))
    await expect(canvas.getByLabelText('Preview freshness')).toHaveTextContent(
      'Out of date'
    )
  }
}
