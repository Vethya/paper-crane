import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as M from './dropdown-menu'

const meta = {
  title: 'UI/DropdownMenu',
  component: M.DropdownMenu,
  tags: ['autodocs'],
  render: (args) => (
    <M.DropdownMenu {...args}>
      <M.DropdownMenuTrigger>Resume actions</M.DropdownMenuTrigger>
      <M.DropdownMenuContent>
        <M.DropdownMenuLabel>Jordan Diaz</M.DropdownMenuLabel>
        <M.DropdownMenuGroup>
          <M.DropdownMenuItem>Duplicate</M.DropdownMenuItem>
          <M.DropdownMenuItem disabled>Delete locked resume</M.DropdownMenuItem>
        </M.DropdownMenuGroup>
        <M.DropdownMenuSeparator />
        <M.DropdownMenuCheckboxItem checked>
          Show tags
        </M.DropdownMenuCheckboxItem>
        <M.DropdownMenuCheckboxItem checked="indeterminate">
          Select resumes
        </M.DropdownMenuCheckboxItem>
        <M.DropdownMenuRadioGroup value="pdf">
          <M.DropdownMenuRadioItem value="pdf">PDF</M.DropdownMenuRadioItem>
          <M.DropdownMenuRadioItem value="json">JSON</M.DropdownMenuRadioItem>
        </M.DropdownMenuRadioGroup>
        <M.DropdownMenuSub>
          <M.DropdownMenuSubTrigger>Share</M.DropdownMenuSubTrigger>
          <M.DropdownMenuSubContent>
            <M.DropdownMenuItem>Email</M.DropdownMenuItem>
          </M.DropdownMenuSubContent>
        </M.DropdownMenuSub>
      </M.DropdownMenuContent>
    </M.DropdownMenu>
  )
} satisfies Meta<typeof M.DropdownMenu>
export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Open: Story = {
  parameters: { a11y: { test: 'todo' } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'))
  }
}
