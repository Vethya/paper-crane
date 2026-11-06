import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queries'

export async function refreshTags(
  client: QueryClient,
  account: string | null,
  resumesChanged: boolean
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
  await Promise.all(
    affected.map((queryKey) =>
      client.invalidateQueries({
        queryKey,
        refetchType: queryKey === details ? 'none' : 'active'
      })
    )
  )
}
