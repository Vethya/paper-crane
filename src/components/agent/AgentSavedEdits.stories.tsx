import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { seeded } from '@/stories/seed'
import { AgentEditReviewBar } from './AgentEditReviewBar'
import { AgentSavedEdits } from './AgentSavedEdits'

const nameEdit = (originalValue: string) => ({
  type: 'set',
  fieldPath: 'basics.name',
  newValue: 'Jordan D.',
  reason: 'Shorter header',
  originalValue
})
const skillEdit = {
  type: 'appendSkill',
  name: 'Cloud',
  keywords: ['AWS'],
  reason: 'Listed in the job'
}
const saved = (edits: unknown[]) => [
  {
    _id: 'session-1',
    pendingEdits: { summary: 'Tailored for Stripe.', edits, status: 'ready' }
  }
]

// Records PATCH bodies so stories can check how the result was closed.
let patches: unknown[] = []
const recordPatches = () => {
  patches = []
  const original = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    if (init?.method === 'PATCH') patches.push(JSON.parse(String(init.body)))
    return original(input, init)
  }
  return () => {
    globalThis.fetch = original
  }
}

// The review bar fades in; wait so accessibility checks see final colors.
const settled = (root: HTMLElement) =>
  waitFor(() => {
    for (const el of root.querySelectorAll('[style*="opacity"]'))
      expect(getComputedStyle(el).opacity).toBe('1')
  })

const meta = {
  component: AgentSavedEdits,
  decorators: [seeded],
  render: () => (
    <>
      <AgentSavedEdits />
      <AgentEditReviewBar />
    </>
  ),
  beforeEach: recordPatches,
  parameters: {
    state: { resumeId: 'jordan' },
    apiData: saved([nameEdit('Jordan Diaz'), skillEdit])
  }
} satisfies Meta<typeof AgentSavedEdits>
export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(
      canvas.findByText(/Tailoring finished: 2 changes ready/)
    ).resolves.toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Review' }))
    await expect(
      canvas.findByText('2 changes to review')
    ).resolves.toBeInTheDocument()
    await settled(canvasElement)
    await expect(canvas.queryByText(/Tailoring finished/)).toBeNull()
    await expect(patches).toEqual([{ pendingEdits: 'applied' }])
  }
}

export const Conflict: Story = {
  parameters: { apiData: saved([nameEdit('Someone else'), skillEdit]) },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Review' }))
    await expect(
      canvas.findByText(/1 of 2 changes are in fields you edited/)
    ).resolves.toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }))
    await expect(
      canvas.findByText('1 change to review')
    ).resolves.toBeInTheDocument()
    await settled(canvasElement)
    await expect(patches).toEqual([{ pendingEdits: 'applied' }])
  }
}

export const ApplyConflictAnyway: Story = {
  parameters: { apiData: saved([nameEdit('Someone else'), skillEdit]) },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Review' }))
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Apply anyway' })
    )
    await expect(
      canvas.findByText('2 changes to review')
    ).resolves.toBeInTheDocument()
    await settled(canvasElement)
  }
}

export const Dismiss: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Dismiss' })
    )
    await waitFor(() =>
      expect(canvas.queryByText(/Tailoring finished/)).toBeNull()
    )
    await expect(canvas.queryByText(/to review/)).toBeNull()
    await expect(patches).toEqual([{ pendingEdits: 'dismissed' }])
  }
}

export const NothingSaved: Story = {
  parameters: { apiData: [] },
  play: async ({ canvas }) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect(canvas.queryByRole('status')).toBeNull()
  }
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.findByText(/Tailoring finished/)).resolves.toBeVisible()
  }
}
