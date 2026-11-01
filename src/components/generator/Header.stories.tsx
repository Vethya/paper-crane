import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { useState } from 'react'
import { useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { resumeTitleAtom } from '@/atoms/resume'
import { Header } from './Header'

const meta = {
  component: Header,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { showTags: false }
} satisfies Meta<typeof Header>
export default meta
type Story = StoryObj<typeof meta>

export const SignedIn: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Jordan Diaz')).toBeVisible()
  }
}
export const SignedOut: Story = {
  parameters: { session: { data: null, isPending: false } }
}
export const Loading: Story = {
  parameters: { session: { data: null, isPending: true } }
}
export const Library: Story = {
  parameters: { nextjs: { navigation: { pathname: '/resumes' } } }
}

function RenameHarness() {
  useHydrateAtoms([[resumeTitleAtom, 'Original resume']])
  const [title, setTitle] = useAtom(resumeTitleAtom)
  const [showHeader, setShowHeader] = useState(true)

  return (
    <>
      {showHeader && <Header showTags={false} />}
      <button
        onClick={() => {
          setShowHeader(false)
          setTitle('Another resume')
        }}
      >
        Open another resume
      </button>
      <output aria-label="Current title">{title}</output>
    </>
  )
}

function deferRenames() {
  const original = globalThis.fetch
  const requests: ((response: Response) => void)[] = []
  globalThis.fetch = (input, init) => {
    if (init?.method === 'PATCH' && String(init.body).includes('"title"')) {
      return new Promise<Response>((resolve) => requests.push(resolve))
    }
    return original(input, init)
  }
  return { requests, restore: () => (globalThis.fetch = original) }
}

export const FailedRenameAfterNavigation: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/generator', query: { id: 'jordan' } } }
  },
  render: () => <RenameHarness />,
  play: async ({ canvas, userEvent }) => {
    const { requests, restore } = deferRenames()
    try {
      await userEvent.click(canvas.getByTitle('Rename'))
      await userEvent.clear(
        canvas.getByRole('textbox', { name: 'Resume title' })
      )
      await userEvent.type(
        canvas.getByRole('textbox', { name: 'Resume title' }),
        'Renamed resume{Enter}'
      )
      await waitFor(() => expect(requests).toHaveLength(1))
      await userEvent.click(
        canvas.getByRole('button', { name: 'Open another resume' })
      )
      requests[0](new Response(null, { status: 503 }))
      await new Promise(requestAnimationFrame)
      await expect(canvas.getByLabelText('Current title')).toHaveTextContent(
        'Another resume'
      )
    } finally {
      restore()
    }
  }
}

export const EarlierFailedRename: Story = {
  parameters: FailedRenameAfterNavigation.parameters,
  render: () => <RenameHarness />,
  play: async ({ canvas, userEvent }) => {
    const { requests, restore } = deferRenames()
    try {
      for (const title of ['First rename', 'Latest rename']) {
        await userEvent.click(canvas.getByTitle('Rename'))
        await userEvent.clear(
          canvas.getByRole('textbox', { name: 'Resume title' })
        )
        await userEvent.type(
          canvas.getByRole('textbox', { name: 'Resume title' }),
          `${title}{Enter}`
        )
      }
      await waitFor(() => expect(requests).toHaveLength(2))
      requests[1](new Response(null, { status: 200 }))
      await new Promise(requestAnimationFrame)
      requests[0](new Response(null, { status: 503 }))
      await new Promise(requestAnimationFrame)
      await expect(canvas.getByTitle('Rename')).toHaveTextContent(
        'Latest rename'
      )
    } finally {
      restore()
    }
  }
}
