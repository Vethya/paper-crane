'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { authClient } from '@/db/auth-client'
import { createQueryClient } from '@/lib/queries'
import { useStore } from 'jotai'
import { formDataAtom } from '@/atoms/formData'
import {
  resumeAtom,
  loadedResumeIdAtom,
  builtFormDataAtom,
  resumeTitleAtom
} from '@/atoms/resume'
import { resumeTagsAtom } from '@/atoms/resumeTags'

const AccountContext = createContext<string | null>(null)
export const useQueryAccount = () => useContext(AccountContext)

function AccountCache({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  const store = useStore()
  useEffect(
    () => () => {
      void client.cancelQueries()
      client.clear()
      store.set(formDataAtom, null)
      store.set(loadedResumeIdAtom, null)
      store.set(builtFormDataAtom, null)
      store.set(resumeTitleAtom, '')
      store.set(resumeTagsAtom, [])
      store.set(resumeAtom, { url: '', isLoading: false, isError: false })
    },
    [client, store]
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession()
  const account = session?.user.id ?? null
  return (
    <AccountContext.Provider value={account}>
      <AccountCache key={account ?? 'guest'}>{children}</AccountCache>
    </AccountContext.Provider>
  )
}
