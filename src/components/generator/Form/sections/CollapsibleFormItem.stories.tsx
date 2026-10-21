import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'

const meta = {
  component: CollapsibleFormItem,
  tags: ['autodocs'],
  args: {
    summary: (
      <CollapsibleFormItemSummary
        title="Northstar Labs"
        detail="Senior Frontend Engineer · Sep 2021 to present"
      />
    ),
    children: <p>Reduced dashboard load time by 38%.</p>,
    isExpanded: true,
    onToggle: fn(),
    onRemove: fn(),
    onMoveUp: fn(),
    onMoveDown: fn(),
    onDragStart: fn()
  }
} satisfies Meta<typeof CollapsibleFormItem>
export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {}
export const Collapsed: Story = { args: { isExpanded: false } }
export const Required: Story = { args: { removeDisabled: true } }
