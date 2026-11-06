import type { QueryClient } from '@tanstack/react-query'
import { ApiError, queryKeys, resumeQuery, type SavedResume } from './queries'

// Saves can outlive the editor. Reopening waits for them before reading.
const writes = new WeakMap<QueryClient, Map<string, Set<Promise<unknown>>>>()

export function trackResumeWork<T>(
  client: QueryClient,
  id: string,
  task: Promise<T>
) {
  const pending = writes.get(client) ?? new Map()
  writes.set(client, pending)
  const group = pending.get(id) ?? new Set<Promise<unknown>>()
  pending.set(id, group)
  group.add(task)
  const done = () => {
    group.delete(task)
    if (!group.size) pending.delete(id)
  }
  void task.then(done, done)
  return task
}

export async function loadResume(
  client: QueryClient,
  account: string,
  id: string,
  checkServer = false
) {
  while (writes.get(client)?.get(id)?.size)
    await Promise.allSettled([...writes.get(client)!.get(id)!])
  return client.fetchQuery({
    ...resumeQuery(account, id),
    ...(checkServer && { staleTime: 0 })
  })
}

export function saveResume(
  client: QueryClient,
  account: string,
  id: string,
  body: string
): Promise<boolean> {
  const key = queryKeys.resume(account, id)
  const operation = (async () => {
    await client.cancelQueries({ queryKey: key, exact: true })
    await client.invalidateQueries({ queryKey: key, refetchType: 'none' })
    const response = await fetch(`/api/resumes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: new TextEncoder().encode(body).length < 60_000
    })
    if (!response.ok) throw new ApiError(response.status)
    const saved = await response.json()
    if (saved.stale) return false
    const changes = JSON.parse(body)
    client.setQueryData<SavedResume>(key, (current) => {
      if (
        current?.contentWriter &&
        saved.contentWriter &&
        current.contentWriter.id === saved.contentWriter.id &&
        current.contentWriter.revision > saved.contentWriter.revision
      )
        return current
      if (
        current &&
        Date.parse(current.updatedAt) > Date.parse(saved.updatedAt)
      )
        return current
      if (!current && !changes.content) return undefined
      return {
        ...current,
        ...saved,
        ...(changes.content && { content: changes.content })
      }
    })
    return true
  })()
  const finish = async () => {
    // PATCH omits content. Reconcile partial or overlapping saves on next open.
    await client.invalidateQueries({ queryKey: key, refetchType: 'none' })
    await client.cancelQueries({ queryKey: queryKeys.resumes(account) })
    await client.invalidateQueries({ queryKey: queryKeys.resumes(account) })
  }
  return trackResumeWork(
    client,
    id,
    operation.then(
      async (accepted) => {
        await finish()
        return accepted
      },
      async (error) => {
        await finish()
        throw error
      }
    )
  )
}
