import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor, within } from 'storybook/test'
import { createStore, Provider } from 'jotai'
import { useState, type ReactNode } from 'react'
import { resumeTagsAtom } from '@/atoms/resumeTags'
import { TagPicker } from './TagPicker'
import { Header } from './Header'

const tags = [
  { _id: 'tag-1', name: 'Remote', color: 'blue' },
  { _id: 'tag-2', name: 'Full-time', color: 'green' },
  { _id: 'tag-3', name: 'Frontend', color: 'gray' }
]

function SeedTags({
  names,
  children
}: {
  names: string[]
  children: ReactNode
}) {
  const [store] = useState(() => {
    const store = createStore()
    store.set(resumeTagsAtom, names)
    return store
  })
  return <Provider store={store}>{children}</Provider>
}

const meta = {
  component: TagPicker,
  tags: ['autodocs'],
  parameters: {
    nextjs: { navigation: { query: { id: 'jordan' } } },
    a11y: { test: 'error' }
  },
  decorators: [
    (Story, { parameters }) => (
      <SeedTags names={parameters.attachedTags ?? []}>
        <div className="flex justify-end">
          <Story />
        </div>
      </SeedTags>
    )
  ],
  play: async ({ canvas, userEvent, parameters }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }))
    await expect(
      canvas.findByText(parameters.apiData?.length ? 'Remote' : 'No tags yet')
    ).resolves.toBeVisible()
  }
} satisfies Meta<typeof TagPicker>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Populated: Story = { parameters: { apiData: tags } }

export const Keyboard: Story = {
  parameters: { apiData: tags },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('textbox')).toHaveFocus()
    await canvas.findByRole('checkbox', { name: 'Remote' })
    await userEvent.keyboard('{ArrowDown} ')
    await expect(canvas.getByRole('checkbox', { name: 'Remote' })).toBeChecked()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(
      canvas.getByRole('checkbox', { name: 'Full-time' })
    ).toBeChecked()
    await userEvent.keyboard('{End}')
    await expect(
      canvas.getByRole('checkbox', { name: 'Frontend' })
    ).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Home}')
    await expect(canvas.getByRole('checkbox', { name: 'Remote' })).toHaveFocus()
    await userEvent.tab()
    const edit = canvas.getByRole('button', { name: 'Edit tag Remote' })
    await expect(edit).toHaveFocus()
    await waitFor(() => expect(edit).toHaveStyle({ opacity: '1' }))
    await userEvent.keyboard('{Enter}')
    const body = within(canvasElement.ownerDocument.body)
    await waitFor(() =>
      expect(body.getByRole('dialog', { name: 'Edit tag' })).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
  }
}

export const EscapeRestoresFocus: Story = {
  parameters: { apiData: tags },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Tags' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  }
}

export const AttachedTags: Story = {
  parameters: { apiData: tags, attachedTags: tags.map((tag) => tag.name) },
  play: async ({ canvas }) => {
    const trigger = await canvas.findByRole('button', {
      name: 'Tags: Remote, Full-time, Frontend'
    })
    await expect(within(trigger).getByText('Remote')).toBeVisible()
    await expect(within(trigger).getByText('Full-time')).toBeVisible()
    await expect(within(trigger).getByText('+1')).toBeVisible()
    await expect(
      within(trigger).queryByText('Frontend')
    ).not.toBeInTheDocument()
  }
}

export const FilterAndCreate: Story = {
  parameters: { apiData: tags },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }))
    await canvas.findByRole('checkbox', { name: 'Remote' })
    await userEvent.type(canvas.getByRole('textbox'), 'Front')
    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('checkbox', { name: 'Frontend' })
    ).toHaveFocus()
    await userEvent.tab()
    await expect(
      canvas.getByRole('button', { name: 'Edit tag Frontend' })
    ).toHaveFocus()
    await userEvent.tab()
    await expect(
      canvas.getByRole('button', { name: 'Create “Front”' })
    ).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const body = within(canvasElement.ownerDocument.body)
    await waitFor(() =>
      expect(body.getByRole('dialog', { name: 'Create tag' })).toBeVisible()
    )
    await expect(body.getByPlaceholderText('Tag name')).toHaveValue('Front')
    await userEvent.keyboard('{Escape}')
  }
}

export const LongNames: Story = {
  parameters: {
    apiData: tags.map((tag) => ({
      ...tag,
      name: `${tag.name} with a very long descriptive name`
    })),
    attachedTags: tags.map(
      (tag) => `${tag.name} with a very long descriptive name`
    )
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = await canvas.findByRole('button', { name: /Tags: Remote/ })
    await userEvent.click(trigger)
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(3)
  }
}

export const InHeader: Story = {
  parameters: {
    layout: 'fullscreen',
    apiData: tags,
    attachedTags: tags.map((tag) => tag.name),
    nextjs: { navigation: { pathname: '/generator', query: { id: 'jordan' } } }
  },
  render: () => <Header />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /^Tags:/ }))
    await expect(canvas.getByRole('checkbox', { name: 'Remote' })).toBeVisible()
  }
}
