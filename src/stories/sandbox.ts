import type { StoryContext } from '@storybook/nextjs-vite'
import { mocked } from 'storybook/test'
import { authClient } from '@/db/auth-client'
import { resume } from './fixtures/resume'

export function sandbox({ parameters }: StoryContext) {
  mocked(authClient.useSession).mockReturnValue(
    parameters.session ?? {
      data: {
        user: {
          id: 'story-user',
          name: 'Jordan Diaz',
          email: 'jordan@example.com'
        }
      },
      isPending: false
    }
  )
  const original = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    const path = new URL(url, location.href).pathname
    if (!path.startsWith('/api/')) return original(input, init)
    if (parameters.apiLoading) return new Promise<Response>(() => {})
    if (parameters.apiText && path.startsWith('/api/agent/chat'))
      return new Response(parameters.apiText)
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase()
    let data: unknown = path.startsWith('/api/resumes/')
      ? { content: resume, tags: [] }
      : []
    if (path.startsWith('/api/tags') && ['POST', 'PATCH'].includes(method)) {
      const body = init?.body
        ? JSON.parse(String(init.body))
        : input instanceof Request
          ? await input.clone().json()
          : {}
      data = {
        _id: method === 'PATCH' ? path.split('/').pop() : 'story-tag',
        name: 'Tag',
        color: 'gray',
        ...body
      }
    }
    return Response.json(parameters.apiData ?? data, {
      status: parameters.apiError ? 503 : 200
    })
  }
  return () => {
    globalThis.fetch = original
  }
}
