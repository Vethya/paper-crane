'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { authClient } from '@/db/auth-client'
import { createQueryClient } from '@/lib/queries'

const AccountContext = createContext<string | null>(null)
export const useQueryAccount = () => useContext(AccountContext)

function AccountCache({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  useEffect(
    () => () => {
      void client.cancelQueries()
      client.clear()
    },
    [client]
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
