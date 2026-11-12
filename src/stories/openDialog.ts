import type { StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor, within } from 'storybook/test'

export const openDialog: NonNullable<StoryObj['play']> = async ({
  canvas,
  userEvent
}) => {
  await userEvent.click(canvas.getByRole('button'))
  await waitFor(() =>
    expect(within(document.body).getByRole('dialog')).toBeVisible()
  )
}
