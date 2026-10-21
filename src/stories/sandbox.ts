import type { StoryContext } from '@storybook/nextjs-vite'
import { mocked } from 'storybook/test'
import { authClient } from '@/db/auth-client'
import { resume } from './fixtures/resume'

export function sandbox({ parameters }: StoryContext) {
  mocked(authClient.useSession).mockReturnValue(
    parameters.session ?? {
      data: { user: { name: 'Jordan Diaz', email: 'jordan@example.com' } },
      isPending: false
    }
  )
  const original = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (!new URL(url, location.href).pathname.startsWith('/api/'))
      return original(input, init)
    if (parameters.apiLoading) return new Promise<Response>(() => {})
    const data = url.includes('/api/resumes/')
      ? { content: resume, tags: [] }
      : []
    return Response.json(parameters.apiData ?? data, {
      status: parameters.apiError ? 503 : 200
    })
  }
  return () => {
    globalThis.fetch = original
  }
}
