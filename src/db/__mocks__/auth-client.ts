import { fn } from 'storybook/test'

export const authClient = {
  useSession: fn(() => ({ data: null, isPending: false })),
  signOut: fn(async () => {})
}
