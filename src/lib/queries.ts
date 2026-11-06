import { QueryClient } from '@tanstack/react-query'
import type { FormValues } from '@/types'
import type { TagColor } from './tagColors'
import type { ResumeComponent } from './resumeComponents'

export interface ResumeListItem {
  _id: string
  title: string
  tags?: string[]
  updatedAt: string
}

export interface SavedResume extends ResumeListItem {
  content: FormValues
  contentWriter?: { id: string; revision: number }
}

export interface TagItem {
  _id: string
  name: string
  color: TagColor
}

export class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed with status ${status}`)
  }
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500) && count < 1
      }
    }
  })
}

export const queryKeys = {
  resumes: (account: string | null) => ['account', account, 'resumes'] as const,
  resume: (account: string | null, id: string) =>
    ['account', account, 'resume', id] as const,
  details: (account: string | null) => ['account', account, 'resume'] as const,
  tags: (account: string | null) => ['account', account, 'tags'] as const,
  components: (account: string | null) =>
    ['account', account, 'components'] as const
}

async function read<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new ApiError(response.status)
  return response.json()
}

export const resumesQuery = (account: string | null) => ({
  queryKey: queryKeys.resumes(account),
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    read<ResumeListItem[]>('/api/resumes', signal),
  enabled: !!account
})

export const resumeQuery = (account: string | null, id: string) => ({
  queryKey: queryKeys.resume(account, id),
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    read<SavedResume>(`/api/resumes/${id}`, signal)
})

export const tagsQuery = (account: string | null) => ({
  queryKey: queryKeys.tags(account),
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    read<TagItem[]>('/api/tags', signal),
  enabled: !!account
})

export const componentsQuery = (account: string | null) => ({
  queryKey: queryKeys.components(account),
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    read<ResumeComponent[]>('/api/components', signal),
  enabled: !!account
})
