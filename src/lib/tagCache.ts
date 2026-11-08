import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queries'
import type { TagItem } from '@/components/generator/TagDialog'

export async function refreshTags(
  client: QueryClient,
  account: string | null,
  resumesChanged: boolean,
  update: (tags: TagItem[]) => TagItem[]
) {
  // Tag rename/delete also changes every resume that uses that tag.
  const details = queryKeys.details(account)
  const affected = [
    queryKeys.tags(account),
    ...(resumesChanged ? [queryKeys.resumes(account), details] : [])
  ]
  await Promise.all(
    affected.map((queryKey) => client.cancelQueries({ queryKey }))
  )
  // Keep the confirmed change even if the refetch below fails.
  client.setQueryData<TagItem[]>(queryKeys.tags(account), (tags) =>
    tags ? update(tags) : tags
  )
  await Promise.all(
    affected.map((queryKey) =>
      client.invalidateQueries({
        queryKey,
        refetchType: queryKey === details ? 'none' : 'active'
      })
    )
  )
}
